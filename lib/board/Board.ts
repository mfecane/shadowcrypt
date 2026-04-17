import type { LogPanel } from '~~/lib/LogPanel'
import type { BoardForBridge } from '~~/lib/board/BoardForBridge'
import type { BoardHost } from '~~/lib/board/BoardHost'
import type { BoardImageLayoutSaveRow } from '~~/lib/board/BoardImageApi'
import { BoardRenderer } from '~~/lib/board/BoardRenderer'
import type { BoardViewportState } from '~~/lib/board/BoardViewport'
import type { NavigationTool } from '~~/lib/board/interaction/tools/NavigationTool'
import { ServiceAlias } from '~~/lib/di/ServiceAlias'
import { container } from '~~/lib/di/container'
import type { CollectionDetail } from '../../app/types/collections'
import { ImageCommandController } from '../collectionViewer/commands/ImageCommandController'
import { ViewerImageTransformCommand } from '../collectionViewer/commands/ImageTransformCommand'
import type { ViewerImageLayoutBatchSnapshot } from '../collectionViewer/commands/ViewerImageLayoutBatchCommand'
import { ViewerLayoutViewportCommand } from '../collectionViewer/commands/ViewerLayoutViewportCommand'
import { roundTripLayoutRects } from '../zig/autoLayout'
import { BoardImage } from './BoardImage'
import { BoardImageLayout } from './BoardImageLayout'
import { BoardVueBridge } from './BoardVueBridge'
import { CollectionAutosave } from './CollectionAutosave'
import { CollectionBoardModel } from './CollectionBoardModel'
import { CollectionBoardModelFactory } from './CollectionBoardModelFactory'
import { computeFitViewportSnapshot, worldBoundsCenter, worldBoundsRectangles } from './layoutGeometry'
import { normalizeLayoutSnapshotsForFit } from './layoutNormalize'

export class Board implements BoardForBridge, BoardHost {
	private static readonly MIN_IMAGE_Z_INDEX = 0

	public readonly bridge: BoardVueBridge = new BoardVueBridge(this)

	public readonly commandController: ImageCommandController = new ImageCommandController(this.bridge)

	public readonly autosave: CollectionAutosave

	private renderer: BoardRenderer | null = null

	private debugOverlayEl: HTMLDivElement | null = null

	private selectedImageId: string | null = null

	private readonly images = new Map<string, BoardImage>()

	private readonly model: CollectionBoardModel

	private static readonly defaultViewportZoom = 1

	private readonly logger = container.resolve<LogPanel>(ServiceAlias.LogPanel)

	public get navigationTool(): NavigationTool | null {
		return this.renderer?.navigationTool ?? null
	}

	public constructor(
		private readonly mountEl: HTMLElement,
		detail: CollectionDetail
	) {
		this.model = new CollectionBoardModelFactory().create(detail)
		this.autosave = new CollectionAutosave(this, this.bridge, this.model.id, this.model.clone())
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

	/** Deep clone of the live collection model (read-only snapshot for consumers). */
	public getModel(): CollectionBoardModel {
		return this.model.clone()
	}

	/** Copies live navigation into the model (viewport center + zoom). */
	public syncViewportToModel(): void {
		const v = this.navigationTool?.getViewportStateForSave() ?? null
		if (v !== null) {
			this.model.setViewportSnapshot({ x: v.centerX, y: v.centerY }, v.zoom)
		}
	}

	/** Applies persisted layouts from the server response into the live model. */
	public afterSuccessfulPersist(layouts: BoardImageLayoutSaveRow[]): void {
		for (const { imageId, layout } of layouts) {
			this.model.syncImageLayout(imageId, layout)
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
		this.renderer?.removeSprite(imageId)
		this.images.delete(imageId)
		this.model.removeImage(imageId)
		this.commandController.clearStacks()
		this.bridge.setCanUndo(this.commandController.canUndo())
		this.bridge.setCanRedo(this.commandController.canRedo())
		this.bridge.setImageCount(this.model.images.length)
		this.navigationTool?.fitWorldToView()
		this.autosave.schedule()
	}

	public async init(): Promise<void> {
		await this.buildViewLayer()
	}

	public destroy(): void {
		this.teardownViewLayer()
		this.autosave.dispose()
		this.bridge.setCollectionSaveState('idle')
	}

	private teardownViewLayer(): void {
		this.renderer?.destroy()
		this.renderer = null
		this.selectedImageId = null
		this.images.clear()
		if (this.debugOverlayEl !== null) {
			this.debugOverlayEl.remove()
			this.debugOverlayEl = null
		}
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
		this.renderer?.syncTransformWidgetFromParentSprite()
		this.autosave.schedule()
	}

	public redo(): void {
		this.commandController.redo()
		this.renderer?.syncTransformWidgetFromParentSprite()
		this.autosave.schedule()
	}

	public flipSelectedImageX(): void {
		const imageId = this.selectedImageId
		if (imageId === null) {
			return
		}
		const sprite = this.renderer?.getSprite(imageId)
		if (sprite === undefined) {
			return
		}
		const before = BoardRenderer.signedSnapshotFromSprite(sprite)
		const after = new BoardImageLayout(
			before.zIndex,
			before.x,
			before.y,
			before.w,
			before.h,
			!before.flipX,
			before.flipY
		)
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
		const ordered = [...this.images.values()].sort(
			(a, b) => a.layout.zIndex - b.layout.zIndex || a.id.localeCompare(b.id)
		)
		const beforeLayout = this.captureLayoutSnapshots(ordered)
		const beforeViewport = this.navigationTool.getViewportStateForSave()
		const afterLayout = normalizeLayoutSnapshotsForFit(beforeLayout)
		const { w: vw, h: vh } = this.getViewportSize()
		const rects = afterLayout.map((s) => s.snapshot.getRect())
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
		this.renderer?.syncTransformWidgetFromParentSprite()
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

			const ordered = [...this.images.values()].sort(
				(a, b) => a.layout.zIndex - b.layout.zIndex || a.id.localeCompare(b.id)
			)
			const beforeLayout = this.captureLayoutSnapshots(ordered)
			const beforeViewport = this.navigationTool!.getViewportStateForSave()
			const normalizedInput = normalizeLayoutSnapshotsForFit(beforeLayout)
			const nextRects = await roundTripLayoutRects(normalizedInput.map((s) => s.snapshot.getRect()))
			if (nextRects.length !== ordered.length) {
				throw new Error(`Expected ${ordered.length} rects from Zig, got ${nextRects.length}`)
			}

			const afterLayout: ViewerImageLayoutBatchSnapshot[] = ordered.map((image, index) => {
				const next = nextRects[index]!

				const layout = image.layout.clone()
				layout.setRect(next)

				return {
					imageId: image.id,
					snapshot: layout,
				}
			})

			const { w: vw, h: vh } = this.getViewportSize()
			const rects = afterLayout.map((s) => s.snapshot.getRect())
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
			this.renderer?.syncTransformWidgetFromParentSprite()
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

	private applySnapshot(imageId: string, s: BoardImageLayout): void {
		this.renderer?.applySnapshotToSprite(imageId, s)
		const bi = this.images.get(imageId)
		if (bi) {
			bi.setLayout(s.clone())
		}
		this.syncModelImage(imageId)
		this.renderer?.syncTransformWidgetFromParentSprite()
	}

	private applySnapshotsBatch(snapshots: ViewerImageLayoutBatchSnapshot[]): void {
		for (const { imageId, snapshot } of snapshots) {
			this.applySnapshot(imageId, snapshot)
		}
	}

	private captureLayoutSnapshots(ordered: BoardImage[]): ViewerImageLayoutBatchSnapshot[] {
		return ordered.map((image) => ({
			imageId: image.id,
			snapshot: image.layout.clone(),
		}))
	}

	private applyViewportSnapshot(v: BoardViewportState): void {
		this.navigationTool?.setViewportFromSaved({ x: v.centerX, y: v.centerY }, v.zoom)
	}

	/** Contiguous z-indices on the collection model + Pixi world order (before layout diff / PATCH). */
	public prepareModelForSave(): void {
		this.model.normalizeImageZIndicesForSave(Board.MIN_IMAGE_Z_INDEX)
		for (const im of this.images.values()) {
			this.renderer?.setSpriteWorldZIndex(im.id, im.layout.zIndex)
		}
		this.syncRuntimeImageOrder()
	}

	public getBridge(): BoardVueBridge {
		return this.bridge
	}

	private syncTransformWidget(): void {
		this.renderer?.syncTransformWidget(this.selectedImageId)
	}

	public selectImage(id: string | null): void {
		this.selectedImageId = id
		if (id !== null) {
			this.touchImage(id)
		}
		this.syncTransformWidget()
		this.bridge.setSelectedImageId(this.selectedImageId)
	}

	public commitTransform(imageId: string, before: BoardImageLayout, after: BoardImageLayout): void {
		this.commandController.execute(
			new ViewerImageTransformCommand(imageId, before, after, (id, s) => this.applySnapshot(id, s))
		)
		this.bridge.setCanUndo(this.commandController.canUndo())
		this.bridge.setCanRedo(this.commandController.canRedo())
		this.autosave.schedule()
	}

	public getWorldSize(): { w: number; h: number } {
		const rects = Array.from(this.images.values()).map((i) => i.layout.getRect())
		const { width: ww, height: wh } = worldBoundsRectangles(rects)
		return { w: ww, h: wh }
	}

	public getWorldBounds(): { minX: number; minY: number; maxX: number; maxY: number; w: number; h: number } {
		const rects = Array.from(this.images.values()).map((i) => i.layout.getRect())
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
		this.renderer?.syncTransformWidgetFromParentSprite()
	}

	private async buildViewLayer(): Promise<void> {
		this.teardownViewLayer()
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
			this.images.set(im.id, im)
		}
		this.logger.log(`seeded image map entries=${this.images.size}`)

		const rectsPlain = items.map((i) => ({ x: i.layout.x, y: i.layout.y, w: i.layout.w, h: i.layout.h }))
		const v = this.model.viewportCenter
		const vz = this.model.viewportZoom
		let initialCenter: { x: number; y: number }
		let initialZoom: number
		if (v === null || vz === null) {
			initialCenter = worldBoundsCenter(rectsPlain)
			initialZoom = Board.defaultViewportZoom
		} else {
			initialCenter = v
			initialZoom = vz
		}

		this.renderer = new BoardRenderer(this.mountEl, this, (msg) => this.logger.log(msg))
		await this.renderer.mount(items, initialCenter, initialZoom)

		this.selectImage(null)
		this.logger.log(`all sprites created count=${items.length}`)
		this.bridge.setCanUndo(this.commandController.canUndo())
		this.bridge.setCanRedo(this.commandController.canRedo())
		this.bridge.setImageCount(items.length)
		this.bridge.setReady(true)
		this.logger.log('build complete, board ready')
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
			max = Math.max(max, image.layout.zIndex)
		}
		return max
	}

	private setImageZIndex(imageId: string, zIndex: number, syncOrder: boolean = true): void {
		const bi = this.images.get(imageId)
		if (bi === undefined) {
			return
		}
		bi.setLayout(
			new BoardImageLayout(
				zIndex,
				bi.layout.x,
				bi.layout.y,
				bi.layout.w,
				bi.layout.h,
				bi.layout.flipX,
				bi.layout.flipY
			)
		)
		this.renderer?.setSpriteWorldZIndex(imageId, zIndex)
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
			x: bi.layout.x,
			y: bi.layout.y,
			w: Math.abs(bi.layout.w),
			h: Math.abs(bi.layout.h),
			flipX: bi.layout.flipX,
			flipY: bi.layout.flipY,
			zIndex: bi.layout.zIndex,
		})
		this.model.sortImagesByZIndex()
	}

	private syncRuntimeImageOrder(): void {
		this.renderer?.sortWorldChildren()
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
