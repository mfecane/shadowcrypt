import { Application, Assets, Container, Rectangle, Sprite } from 'pixi.js'
import type { LogPanel } from '~~/lib/LogPanel'
import { TransformWidget } from '~~/lib/board/interaction/widgets/TransformWidget'
import { ServiceAlias } from '~~/lib/di/ServiceAlias'
import { container } from '~~/lib/di/container'
import type { CollectionDetail } from '../../app/types/collections'
import { ImageCommandController } from '../collectionViewer/commands/ImageCommandController'
import {
	ViewerImageTransformCommand,
	type ViewerSpriteSnapshot,
} from '../collectionViewer/commands/ImageTransformCommand'
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

export class Board {
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
			})
		}
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
		this.fitWorldToView()
	}

	private static worldBounds(rects: { x: number; y: number; w: number; h: number }[]): {
		width: number
		height: number
	} {
		let maxX = 8
		let maxY = 8
		for (const r of rects) {
			maxX = Math.max(maxX, r.x + r.w + 8)
			maxY = Math.max(maxY, r.y + r.h + 8)
		}
		return { width: maxX, height: maxY }
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
	}

	public undo(): void {
		this.commandController.undo()
		this.transformWidget?.syncFromParentSprite()
		this.bridge.setCanUndo(this.commandController.canUndo())
		this.bridge.setCanRedo(this.commandController.canRedo())
		this.autosave.schedule()
	}

	public redo(): void {
		this.commandController.redo()
		this.transformWidget?.syncFromParentSprite()
		this.bridge.setCanUndo(this.commandController.canUndo())
		this.bridge.setCanRedo(this.commandController.canRedo())
		this.autosave.schedule()
	}

	public fitWorldToView(): void {
		this.navigationTool?.fitWorldToView()
		this.autosave.schedule()
	}

	private openFullscreenById(imageId: string): void {
		const im = this.images.get(imageId)
		if (!im) return
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
		sp.x = s.x
		sp.y = s.y
		sp.width = s.width
		sp.height = s.height
		const bi = this.images.get(imageId)
		if (bi) {
			bi.rect = { x: s.x, y: s.y, w: s.width, h: s.height }
		}
		this.transformWidget?.syncFromParentSprite()
	}

	public layoutRowsForSave(): CollectionLayoutRow[] {
		const rows: CollectionLayoutRow[] = []
		for (const [id, bi] of this.images) {
			const r = bi.rect
			rows.push({
				imageId: id,
				layoutX: r.x,
				layoutY: r.y,
				layoutW: r.w,
				layoutH: r.h,
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
		world.setChildIndex(sp, world.children.length - 1)
		sp.addChild(widget)
		widget.show()
		widget.syncFromParentSprite()
	}

	private selectImage(id: string | null): void {
		this.selectedImageId = id
		this.syncTransformWidget()
		this.bridge.setSelectedImageId(this.selectedImageId)
	}

	public getWorldSize(): { w: number; h: number } {
		const rects = Array.from(this.images.values()).map((i) => i.rect)
		const { width: ww, height: wh } = Board.worldBounds(rects)
		return { w: ww, h: wh }
	}

	public syncTransformWidgetFromParentSprite(): void {
		this.transformWidget?.syncFromParentSprite()
	}

	private async buildPixi(): Promise<void> {
		this.teardownPixi()
		this.bridge.setCollection(this.model.id, this.model.name)
		this.bridge.setReady(false)
		this.logger.log(`start collection=${this.model.id} images=${this.model.images.length}`)

		const items = this.model.images
		if (items.length === 0) {
			this.logger.log('no images, marking board ready')
			this.bridge.setImageCount(0)
			this.bridge.setReady(true)
			return
		}

		for (const im of items) {
			const r: BoardRect = { ...im.layout }
			this.images.set(im.id, new BoardImage(im.id, im.url, r))
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
		this.app.stage.addChild(this.worldContainer)

		this.app.stage.eventMode = 'static'
		this.app.stage.hitArea = new Rectangle(0, 0, viewport.w, viewport.h)

		this.interactionContext = new PixiInteractionContext(this.worldContainer, this.spriteById)

		this.transformWidget = new TransformWidget()
		this.transformWidget.hide()

		this.navigationTool = new NavigationTool(this.worldContainer, canvas, this.app.renderer, this)

		// Jesus, this guy loves callbacks!!
		this.router = new EventRouter([
			new HoverTool(canvas),
			new FullscreenTool((id) => this.openFullscreenById(id)),
			new TransformTool(
				this.worldContainer,
				canvas,
				() => this.transformWidget,
				() => {},
				(imageId, before, after) => {
					this.commandController.execute(
						new ViewerImageTransformCommand(imageId, before, after, (id, s) => this.applySnapshot(id, s))
					)
					this.bridge.setCanUndo(this.commandController.canUndo())
					this.bridge.setCanRedo(this.commandController.canRedo())
					this.autosave.schedule()
				}
			),
			new SelectTool(
				(id) => this.selectImage(id),
				() => this.selectImage(null),
				() => {}
			),
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
				sprite.x = L.x
				sprite.y = L.y
				sprite.width = L.w
				sprite.height = L.h
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
}
