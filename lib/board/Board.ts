import { Application, Assets, Container, Rectangle, Sprite } from 'pixi.js'
import type { LogPanel } from '~~/lib/LogPanel'
import { TransformWidget } from '~~/lib/board/interaction/widgets/TransformWidget'
import { ServiceAlias } from '~~/lib/di/ServiceAlias'
import { container } from '~~/lib/di/container'
import type { CollectionDetail } from '../../app/types/collections'
import { ImageCommandController } from '../collectionViewer/commands/ImageCommandController'
import type { ViewerSpriteSnapshot } from '../collectionViewer/commands/ImageTransformCommand'
import { ViewerImageTransformCommand } from '../collectionViewer/commands/ImageTransformCommand'
import type { ViewerImageLayoutBatchSnapshot } from '../collectionViewer/commands/ViewerImageLayoutBatchCommand'
import type { ViewportSnapshot } from '../collectionViewer/commands/ViewerLayoutViewportCommand'
import { ViewerLayoutViewportCommand } from '../collectionViewer/commands/ViewerLayoutViewportCommand'
import { roundTripLayoutRects } from '../zig/autoLayout'
import { BoardImage, type BoardRect } from './BoardImage'
import { BoardVueBridge } from './BoardVueBridge'
import { CollectionAutosave, type CollectionLayoutRow } from './CollectionAutosave'
import { CollectionBoardModel } from './CollectionBoardModel'
import { CollectionBoardModelFactory } from './CollectionBoardModelFactory'
import { EventPreprocessor } from './interaction/EventPreprocessor'
import { EventRouter } from './interaction/EventRouter'
import { PixiInteractionContext } from './interaction/PixiInteractionContext'
import { FullscreenTool } from './interaction/tools/FullscreenTool'
import { HoverTool } from './interaction/tools/HoverTool'
import { NavigationTool } from './interaction/tools/NavigationTool'
import { SelectTool } from './interaction/tools/SelectTool'
import { TransformTool } from './interaction/tools/TransformTool'
import { computeFitViewportSnapshot, worldBoundsRectangles } from './layoutGeometry'
import { normalizeLayoutSnapshotsForFit } from './layoutNormalize'

export class Board {
	private static readonly MIN_IMAGE_Z_INDEX = 0

	public readonly bridge: BoardVueBridge = new BoardVueBridge(this)

	public readonly commandController: ImageCommandController = new ImageCommandController(this.bridge)

	public readonly autosave: CollectionAutosave

	private app: Application | null = null
	private worldContainer: Container | null = null
	private preprocessor: EventPreprocessor | null = null
	private router: EventRouter | null = null
	public navigationTool: NavigationTool | null = null
	private interactionContext: PixiInteractionContext | null = null
	private resizeObserver: ResizeObserver | null = null
	private debugOverlayEl: HTMLDivElement | null = null
	private debugLines: string[] = []

	private readonly spriteById = new Map<string, Sprite>()
	private transformWidget: TransformWidget | null = null

	private selectedImageId: string | null = null

	private readonly images = new Map<string, BoardImage>()

	private readonly model: CollectionBoardModel

	private static readonly defaultViewportZoom = 1

	private readonly logger = container.resolve<LogPanel>(ServiceAlias.LogPanel)

	private static spriteBaseSize(sprite: Sprite): { width: number; height: number } {
		const texture = sprite.texture
		return {
			width: texture.orig.width > 0 ? texture.orig.width : texture.width,
			height: texture.orig.height > 0 ? texture.orig.height : texture.height,
		}
	}

	private static signedSnapshotFromSprite(sprite: Sprite): ViewerSpriteSnapshot {
		const base = Board.spriteBaseSize(sprite)
		const width = Math.abs(sprite.scale.x * base.width)
		const height = Math.abs(sprite.scale.y * base.height)
		const flipX = sprite.scale.x < 0
		const flipY = sprite.scale.y < 0
		return {
			x: flipX ? sprite.x - width : sprite.x,
			y: flipY ? sprite.y - height : sprite.y,
			width,
			height,
			flipX,
			flipY,
		}
	}

	private static applySnapshotToSprite(sprite: Sprite, snapshot: ViewerSpriteSnapshot): void {
		const base = Board.spriteBaseSize(sprite)
		const safeBaseW = Math.max(1e-6, base.width)
		const safeBaseH = Math.max(1e-6, base.height)
		const scaleX = Math.abs(snapshot.width) / safeBaseW
		const scaleY = Math.abs(snapshot.height) / safeBaseH
		sprite.scale.x = snapshot.flipX ? -scaleX : scaleX
		sprite.scale.y = snapshot.flipY ? -scaleY : scaleY
		sprite.x = snapshot.flipX ? snapshot.x + Math.abs(snapshot.width) : snapshot.x
		sprite.y = snapshot.flipY ? snapshot.y + Math.abs(snapshot.height) : snapshot.y
	}

	public constructor(
		private readonly mountEl: HTMLElement,
		detail: CollectionDetail
	) {
		this.model = new CollectionBoardModelFactory().create(detail)
		this.autosave = new CollectionAutosave(this, this.bridge, this.model.id)
		this.bridge.setCollection(this.model.id, this.model.name)
		this.bridge.setImageCount(this.model.images.length)
	}

	public setCollectionName(name: string): void {
		this.model.setName(name)
		this.bridge.setCollection(this.model.id, name)
	}

	public saveNow(): void {
		this.autosave.saveNow()
	}

	/** Updates the in-memory model after a successful server persist (viewport + image layouts). */
	public afterSuccessfulPersist(
		viewport: { centerX: number; centerY: number; zoom: number } | null,
		layouts: CollectionLayoutRow[]
	): void {
		if (viewport !== null) {
			this.model.setViewportSnapshot({ x: viewport.centerX, y: viewport.centerY }, viewport.zoom)
		}
		for (const l of layouts) {
			this.model.syncImageLayout(l.imageId, {
				x: l.layoutX,
				y: l.layoutY,
				w: l.layoutW,
				h: l.layoutH,
				flipX: l.layoutFlipX,
				flipY: l.layoutFlipY,
				zIndex: l.layoutZ,
			})
		}
		this.model.sortImagesByZIndex()
	}

	// TODO: not undoable
	public removeImage(imageId: string): void {
		if (!this.images.has(imageId)) {
			return
		}
		if (this.bridge.fullscreenImage?.id === imageId) {
			this.bridge.closeFullscreen()
		}
		if (this.selectedImageId === imageId) {
			this.selectImage(null)
		}
		const sp = this.spriteById.get(imageId)
		if (sp !== undefined && this.worldContainer !== null) {
			this.worldContainer.removeChild(sp)
			sp.destroy({ texture: true })
			this.spriteById.delete(imageId)
		}
		this.images.delete(imageId)
		this.model.removeImage(imageId)
		this.commandController.clearStacks()
		this.bridge.setCanUndo(this.commandController.canUndo())
		this.bridge.setCanRedo(this.commandController.canRedo())
		this.bridge.setImageCount(this.model.images.length)
		this.navigationTool?.fitWorldToView()
		this.autosave.schedule()
	}

	/** World-space center of image layout bounds; used when no viewport is stored yet (not auto-fit). */
	private static worldBoundsCenter(rects: { x: number; y: number; w: number; h: number }[]): {
		x: number
		y: number
	} {
		if (rects.length === 0) {
			return { x: 0, y: 0 }
		}
		let minX = Infinity
		let minY = Infinity
		let maxX = -Infinity
		let maxY = -Infinity
		for (const r of rects) {
			minX = Math.min(minX, r.x)
			minY = Math.min(minY, r.y)
			maxX = Math.max(maxX, r.x + r.w)
			maxY = Math.max(maxY, r.y + r.h)
		}
		return { x: (minX + maxX) / 2, y: (minY + maxY) / 2 }
	}

	public async init(): Promise<void> {
		await this.buildPixi()
	}

	public destroy(): void {
		this.teardownPixi()
		this.autosave.dispose()
		this.bridge.setCollectionSaveState('idle')
	}

	private teardownPixi(): void {
		if (this.resizeObserver !== null) {
			this.resizeObserver.disconnect()
			this.resizeObserver = null
		}
		this.preprocessor?.detach()
		this.preprocessor = null
		this.navigationTool?.destroy()
		this.navigationTool = null
		this.router = null
		this.interactionContext = null
		if (this.transformWidget !== null) {
			this.transformWidget.destroy({ children: true })
			this.transformWidget = null
		}
		this.spriteById.clear()
		this.worldContainer = null
		this.selectedImageId = null
		this.images.clear()
		if (this.app !== null) {
			this.app.destroy(true)
			this.app = null
		}
		if (this.debugOverlayEl !== null) {
			this.debugOverlayEl.remove()
			this.debugOverlayEl = null
		}
		this.debugLines = []
		this.bridge.setSelectedImageId(this.selectedImageId)
		this.bridge.setCanUndo(this.commandController.canUndo())
		this.bridge.setCanRedo(this.commandController.canRedo())
		this.bridge.setImageCount(0)
		this.bridge.setReady(false)
		this.bridge.closeFullscreen()
		this.bridge.setAutoLayoutPending(false)
	}

	public undo(): void {
		this.commandController.undo()
		this.transformWidget?.syncFromParentSprite()
		this.autosave.schedule()
	}

	public redo(): void {
		this.commandController.redo()
		this.transformWidget?.syncFromParentSprite()
		this.autosave.schedule()
	}

	public flipSelectedImageX(): void {
		const imageId = this.selectedImageId
		if (imageId === null) {
			return
		}
		const sprite = this.spriteById.get(imageId)
		if (sprite === undefined) {
			return
		}
		const before = Board.signedSnapshotFromSprite(sprite)
		const after: ViewerSpriteSnapshot = {
			x: before.x,
			y: before.y,
			width: before.width,
			height: before.height,
			flipX: !before.flipX,
			flipY: before.flipY,
		}
		this.commandController.execute(
			new ViewerImageTransformCommand(imageId, before, after, (id, s) => this.applySnapshot(id, s))
		)
		this.bridge.setCanUndo(this.commandController.canUndo())
		this.bridge.setCanRedo(this.commandController.canRedo())
		this.autosave.schedule()
	}

	/** Normalize layouts + fit camera; single undo step. */
	public fitIntoView(): void {
		if (this.images.size === 0 || this.navigationTool === null) {
			return
		}
		const ordered = [...this.images.values()].sort((a, b) => a.zIndex - b.zIndex || a.id.localeCompare(b.id))
		const beforeLayout = this.captureLayoutSnapshots(ordered)
		const beforeViewport = this.navigationTool.getViewportStateForSave()
		const afterLayout = normalizeLayoutSnapshotsForFit(beforeLayout)
		const { w: vw, h: vh } = this.getViewportSize()
		const rects = afterLayout.map((s) => ({
			x: s.snapshot.x,
			y: s.snapshot.y,
			w: s.snapshot.width,
			h: s.snapshot.height,
		}))
		const bounds = worldBoundsRectangles(rects)
		const afterViewport = computeFitViewportSnapshot(vw, vh, bounds)
		this.commandController.execute(
			new ViewerLayoutViewportCommand(
				beforeLayout,
				afterLayout,
				beforeViewport,
				afterViewport,
				(snapshots) => this.applySnapshotsBatch(snapshots),
				(v) => this.applyViewportSnapshot(v)
			)
		)
		this.transformWidget?.syncFromParentSprite()
		this.bridge.setCanUndo(this.commandController.canUndo())
		this.bridge.setCanRedo(this.commandController.canRedo())
		this.autosave.schedule()
	}

	/**
	 * Normalize (memory) → Zig autolayout → fit viewport: **one** {@link ViewerLayoutViewportCommand},
	 * one undo step. Normalization is not applied until execute; it is not a separate stack entry.
	 */
	public async autoLayout(): Promise<void> {
		if (this.bridge.autoLayoutPending || this.images.size === 0) {
			return
		}

		this.bridge.setAutoLayoutPending(true)
		// Let Vue flush, then wait until after a paint so cached WASM cannot clear pending before paint.
		await this.waitForNextPaint()
		try {
			if (this.bridge.fullscreenImage !== null) {
				this.bridge.closeFullscreen()
			}
			if (this.selectedImageId !== null) {
				this.selectImage(null)
			}

			const ordered = [...this.images.values()].sort((a, b) => a.zIndex - b.zIndex || a.id.localeCompare(b.id))
			const beforeLayout = this.captureLayoutSnapshots(ordered)
			const beforeViewport = this.navigationTool!.getViewportStateForSave()
			const normalizedInput = normalizeLayoutSnapshotsForFit(beforeLayout)
			const nextRects = await roundTripLayoutRects(
				normalizedInput.map((s) => ({
					x: s.snapshot.x,
					y: s.snapshot.y,
					w: s.snapshot.width,
					h: s.snapshot.height,
				}))
			)
			if (nextRects.length !== ordered.length) {
				throw new Error(`Expected ${ordered.length} rects from Zig, got ${nextRects.length}`)
			}

			const afterLayout: ViewerImageLayoutBatchSnapshot[] = ordered.map((image, index) => {
				const next = nextRects[index]!
				return {
					imageId: image.id,
					snapshot: {
						x: next.x,
						y: next.y,
						width: next.w,
						height: next.h,
						flipX: image.rect.flipX,
						flipY: image.rect.flipY,
					},
				}
			})

			const { w: vw, h: vh } = this.getViewportSize()
			const rects = afterLayout.map((s) => ({
				x: s.snapshot.x,
				y: s.snapshot.y,
				w: s.snapshot.width,
				h: s.snapshot.height,
			}))
			const bounds = worldBoundsRectangles(rects)
			const afterViewport = computeFitViewportSnapshot(vw, vh, bounds)

			this.commandController.execute(
				new ViewerLayoutViewportCommand(
					beforeLayout,
					afterLayout,
					beforeViewport,
					afterViewport,
					(snapshots) => this.applySnapshotsBatch(snapshots),
					(v) => this.applyViewportSnapshot(v),
					'viewer_autolayout_fit'
				)
			)
			this.transformWidget?.syncFromParentSprite()
			this.bridge.setCanUndo(this.commandController.canUndo())
			this.bridge.setCanRedo(this.commandController.canRedo())
			this.autosave.schedule()
		} catch (error: unknown) {
			console.error('Auto layout failed:', error)
		} finally {
			this.bridge.setAutoLayoutPending(false)
		}
	}

	public openFullscreenById(imageId: string): void {
		const im = this.images.get(imageId)
		if (!im) return
		this.touchImage(imageId)
		this.bridge.openFullscreen(im)
	}

	public getViewportSize(): { w: number; h: number } {
		const r = this.mountEl.getBoundingClientRect()
		return { w: r.width || 800, h: r.height || 600 }
	}

	private setupResizeObserver(): void {
		if (this.app === null) {
			return
		}
		this.resizeObserver = new ResizeObserver((entries) => {
			const entry = entries[0]
			if (entry === undefined || this.app === null) {
				return
			}
			const w = entry.contentRect.width
			const h = entry.contentRect.height
			if (w < 1 || h < 1) {
				return
			}
			this.app.renderer.resize(w, h)
			this.app.stage.hitArea = new Rectangle(0, 0, w, h)
			this.navigationTool?.applyViewport()
			this.transformWidget?.syncFromParentSprite()
		})
		this.resizeObserver.observe(this.mountEl)
	}

	private applySnapshot(imageId: string, s: ViewerSpriteSnapshot): void {
		const sp = this.spriteById.get(imageId)
		if (!sp) {
			return
		}
		Board.applySnapshotToSprite(sp, s)
		const bi = this.images.get(imageId)
		if (bi) {
			bi.rect = {
				x: s.x,
				y: s.y,
				w: Math.abs(s.width),
				h: Math.abs(s.height),
				flipX: s.flipX,
				flipY: s.flipY,
			}
		}
		this.syncModelImage(imageId)
		this.transformWidget?.syncFromParentSprite()
	}

	private applySnapshotsBatch(snapshots: ViewerImageLayoutBatchSnapshot[]): void {
		for (const { imageId, snapshot } of snapshots) {
			this.applySnapshot(imageId, snapshot)
		}
	}

	private captureLayoutSnapshots(ordered: BoardImage[]): ViewerImageLayoutBatchSnapshot[] {
		return ordered.map((image) => ({
			imageId: image.id,
			snapshot: {
				x: image.rect.x,
				y: image.rect.y,
				width: image.rect.w,
				height: image.rect.h,
				flipX: image.rect.flipX,
				flipY: image.rect.flipY,
			},
		}))
	}

	private applyViewportSnapshot(v: ViewportSnapshot): void {
		this.navigationTool?.setViewportFromSaved({ x: v.centerX, y: v.centerY }, v.zoom)
	}

	public layoutRowsForSave(): CollectionLayoutRow[] {
		const rows: CollectionLayoutRow[] = []
		for (const bi of this.normalizeImageZIndices()) {
			const r = bi.rect
			rows.push({
				imageId: bi.id,
				layoutX: r.x,
				layoutY: r.y,
				layoutW: r.w,
				layoutH: r.h,
				layoutZ: bi.zIndex,
				layoutFlipX: r.flipX,
				layoutFlipY: r.flipY,
			})
		}
		return rows
	}

	public getBridge(): BoardVueBridge {
		return this.bridge
	}

	public viewportForSave(): { centerX: number; centerY: number; zoom: number } | null {
		return this.navigationTool?.getViewportStateForSave() ?? null
	}

	private syncTransformWidget(): void {
		const widget = this.transformWidget
		const world = this.worldContainer
		if (widget === null || world === null) {
			return
		}
		if (widget.parent !== null) {
			widget.parent.removeChild(widget)
		}
		if (this.selectedImageId === null) {
			widget.hide()
			return
		}
		const sp = this.spriteById.get(this.selectedImageId)
		if (sp === undefined) {
			widget.hide()
			return
		}
		sp.addChild(widget)
		widget.show()
		widget.syncFromParentSprite()
	}

	public selectImage(id: string | null): void {
		this.selectedImageId = id
		if (id !== null) {
			this.touchImage(id)
		}
		this.syncTransformWidget()
		this.bridge.setSelectedImageId(this.selectedImageId)
	}

	public commitTransform(imageId: string, before: ViewerSpriteSnapshot, after: ViewerSpriteSnapshot): void {
		this.commandController.execute(
			new ViewerImageTransformCommand(imageId, before, after, (id, s) => this.applySnapshot(id, s))
		)
		this.bridge.setCanUndo(this.commandController.canUndo())
		this.bridge.setCanRedo(this.commandController.canRedo())
		this.autosave.schedule()
	}

	public getWorldSize(): { w: number; h: number } {
		const rects = Array.from(this.images.values()).map((i) => i.rect)
		const { width: ww, height: wh } = worldBoundsRectangles(rects)
		return { w: ww, h: wh }
	}

	public getWorldBounds(): { minX: number; minY: number; maxX: number; maxY: number; w: number; h: number } {
		const rects = Array.from(this.images.values()).map((i) => i.rect)
		const bounds = worldBoundsRectangles(rects)
		return {
			minX: bounds.minX,
			minY: bounds.minY,
			maxX: bounds.maxX,
			maxY: bounds.maxY,
			w: bounds.width,
			h: bounds.height,
		}
	}

	public syncTransformWidgetFromParentSprite(): void {
		this.transformWidget?.syncFromParentSprite()
	}

	private async buildPixi(): Promise<void> {
		this.teardownPixi()
		this.bridge.setCollection(this.model.id, this.model.name)
		this.bridge.setReady(false)
		this.logger.log(`start collection=${this.model.id} images=${this.model.images.length}`)

		const items = [...this.model.images].sort(
			(a, b) => a.layout.zIndex - b.layout.zIndex || a.id.localeCompare(b.id)
		)
		if (items.length === 0) {
			this.logger.log('no images, marking board ready')
			this.bridge.setImageCount(0)
			this.bridge.setReady(true)
			return
		}

		for (const im of items) {
			const r: BoardRect = {
				...im.layout,
				flipX: im.layout.flipX ?? false,
				flipY: im.layout.flipY ?? false,
			}
			this.images.set(im.id, new BoardImage(im.id, im.url, r, im.layout.zIndex))
		}
		this.logger.log(`seeded image map entries=${this.images.size}`)

		const rects = items.map((i) => i.layout)

		const viewport = this.getViewportSize()
		this.logger.log(`viewport ${Math.round(viewport.w)}x${Math.round(viewport.h)}`)

		this.app = new Application()
		this.logger.log('initializing pixi application')
		try {
			await this.app.init({
				width: viewport.w,
				height: viewport.h,
				backgroundAlpha: 0,
				antialias: true,
				resolution: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
				autoDensity: true,
			})
		} catch (error) {
			this.logger.log(`app.init failed: ${error instanceof Error ? error.message : String(error)}`)
			throw error
		}
		this.logger.log('pixi application initialized')

		const canvas = this.app.canvas as HTMLCanvasElement
		canvas.style.display = 'block'
		canvas.style.width = '100%'
		canvas.style.height = '100%'
		canvas.style.touchAction = 'none'
		this.mountEl.appendChild(canvas)
		this.logger.log('canvas attached to mount element')

		this.worldContainer = new Container()
		this.worldContainer.sortableChildren = true
		this.app.stage.addChild(this.worldContainer)

		this.app.stage.eventMode = 'static'
		this.app.stage.hitArea = new Rectangle(0, 0, viewport.w, viewport.h)

		this.interactionContext = new PixiInteractionContext(this.worldContainer, this.spriteById)

		this.transformWidget = new TransformWidget()
		this.transformWidget.hide()

		this.navigationTool = new NavigationTool(this.worldContainer, canvas, this.app.renderer, this)

		this.router = new EventRouter([
			new HoverTool(canvas),
			new FullscreenTool(this),
			new TransformTool(
				this.worldContainer,
				canvas,
				this,
				() => this.transformWidget
			),
			new SelectTool(this),
			this.navigationTool,
		])

		this.preprocessor = new EventPreprocessor(canvas, this.app.renderer, this.interactionContext, (e) =>
			this.router!.dispatch(e)
		)
		this.preprocessor.attach()
		this.logger.log('interaction stack attached')

		for (const [index, im] of items.entries()) {
			this.logger.log(`loading image ${index + 1}/${items.length} id=${im.id}`)
			try {
				const texture = await Assets.load(im.url)
				const bi = this.images.get(im.id)
				if (bi) {
					bi.width = texture.width
					bi.height = texture.height
				}
				const sprite = new Sprite(texture)
				const L = im.layout
				const flipX = L.flipX ?? false
				const flipY = L.flipY ?? false
				const scaleX = L.w / Math.max(1e-6, texture.width)
				const scaleY = L.h / Math.max(1e-6, texture.height)
				sprite.scale.x = flipX ? -scaleX : scaleX
				sprite.scale.y = flipY ? -scaleY : scaleY
				sprite.x = flipX ? L.x + L.w : L.x
				sprite.y = flipY ? L.y + L.h : L.y
				sprite.zIndex = L.zIndex
				sprite.eventMode = 'static'
				sprite.cursor = 'pointer'
				this.worldContainer.addChild(sprite)
				this.spriteById.set(im.id, sprite)
				this.logger.log(
					`image ready ${index + 1}/${items.length} id=${im.id} tex=${texture.width}x${texture.height}`
				)
			} catch (error) {
				this.logger.log(
					`image failed ${index + 1}/${items.length} id=${im.id}: ${
						error instanceof Error ? error.message : String(error)
					}`
				)
				throw error
			}
		}
		this.logger.log(`all sprites created count=${this.spriteById.size}`)
		this.worldContainer.sortChildren()

		this.selectImage(null)
		const v = this.model.viewportCenter
		const vz = this.model.viewportZoom
		if (v !== null && vz !== null) {
			this.navigationTool.setViewportFromSaved(v, vz)
		} else {
			this.navigationTool.setViewportFromSaved(Board.worldBoundsCenter(rects), Board.defaultViewportZoom)
		}
		this.logger.log('viewport initialized')
		this.setupResizeObserver()
		this.logger.log('resize observer attached')
		this.bridge.setCanUndo(this.commandController.canUndo())
		this.bridge.setCanRedo(this.commandController.canRedo())
		this.bridge.setImageCount(items.length)
		this.bridge.setReady(true)
		this.logger.log('build complete, board ready')
	}

	private normalizeImageZIndices(): BoardImage[] {
		const ordered = [...this.images.values()].sort((a, b) => a.zIndex - b.zIndex || a.id.localeCompare(b.id))
		for (const [index, image] of ordered.entries()) {
			this.setImageZIndex(image.id, Board.MIN_IMAGE_Z_INDEX + index, false)
		}
		this.syncRuntimeImageOrder()
		return ordered
	}

	public touchImage(imageId: string): void {
		if (!this.images.has(imageId)) {
			return
		}
		this.setImageZIndex(imageId, this.getMaxImageZIndex() + 1)
		this.autosave.schedule()
	}

	private getMaxImageZIndex(): number {
		let max = Board.MIN_IMAGE_Z_INDEX - 1
		for (const image of this.images.values()) {
			max = Math.max(max, image.zIndex)
		}
		return max
	}

	private setImageZIndex(imageId: string, zIndex: number, syncOrder: boolean = true): void {
		const bi = this.images.get(imageId)
		if (bi === undefined) {
			return
		}
		bi.zIndex = zIndex
		const sp = this.spriteById.get(imageId)
		if (sp !== undefined) {
			sp.zIndex = zIndex
		}
		this.syncModelImage(imageId)
		if (syncOrder) {
			this.syncRuntimeImageOrder()
		}
	}

	private syncModelImage(imageId: string): void {
		const bi = this.images.get(imageId)
		if (bi === undefined) {
			return
		}
		this.model.syncImageLayout(imageId, {
			x: bi.rect.x,
			y: bi.rect.y,
			w: Math.abs(bi.rect.w),
			h: Math.abs(bi.rect.h),
			flipX: bi.rect.flipX,
			flipY: bi.rect.flipY,
			zIndex: bi.zIndex,
		})
		this.model.sortImagesByZIndex()
	}

	private syncRuntimeImageOrder(): void {
		this.worldContainer?.sortChildren()
		this.model.sortImagesByZIndex()
	}

	private async waitForNextPaint(): Promise<void> {
		return new Promise((resolve) => {
			requestAnimationFrame(() => {
				requestAnimationFrame(() => resolve())
			})
		})
	}
}
