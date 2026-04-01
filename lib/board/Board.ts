import { Application, Assets, Container, Rectangle, Sprite } from 'pixi.js'
import type { CollectionDetail } from '../../app/types/collections'
import { ImageCommandController } from '../collectionViewer/commands/ImageCommandController'
import {
	ViewerImageTransformCommand,
	type ViewerSpriteSnapshot,
} from '../collectionViewer/commands/ImageTransformCommand'
import { BoardImage, type BoardRect } from './BoardImage'
import { BoardVueBridge } from './BoardVueBridge'
import { CollectionAutosave, type CollectionLayoutRow } from './CollectionAutosave'
import { EventPreprocessor } from './interaction/EventPreprocessor'
import { EventRouter } from './interaction/EventRouter'
import { PixiInteractionContext } from './interaction/PixiInteractionContext'
import { FullscreenTool } from './interaction/tools/FullscreenTool'
import { HoverTool } from './interaction/tools/HoverTool'
import { NavigationTool } from './interaction/tools/NavigationTool'
import { SelectTool } from './interaction/tools/SelectTool'
import { TransformTool } from './interaction/tools/TransformTool'
import { TransformWidget } from './interaction/widgets/TransformWidget'

export class Board {
	public readonly bridge = new BoardVueBridge()

	private readonly commandController = new ImageCommandController()
	private readonly autosave: CollectionAutosave

	private app: Application | null = null
	private worldContainer: Container | null = null
	private preprocessor: EventPreprocessor | null = null
	private router: EventRouter | null = null
	private navigationTool: NavigationTool | null = null
	private interactionContext: PixiInteractionContext | null = null
	private resizeObserver: ResizeObserver | null = null

	private readonly spriteById = new Map<string, Sprite>()
	private transformWidget: TransformWidget | null = null

	private selectedImageId: string | null = null

	private readonly images = new Map<string, BoardImage>()

	public constructor(
		private readonly mountEl: HTMLElement,
		private collection: CollectionDetail
	) {
		this.autosave = new CollectionAutosave(this, this.bridge, this.collection.id)
		this.bridge.setCollection(this.collection.id, this.collection.name)
		this.bridge.setImageCount(this.collection.images.length)
	}

	public setCollectionName(name: string): void {
		this.collection.name = name
		this.bridge.setCollection(this.collection.id, name)
	}

	public setCollectionViewportSnapshot(center: { x: number; y: number }, zoom: number): void {
		this.collection.viewportCenter = { x: center.x, y: center.y }
		this.collection.viewportZoom = zoom
	}

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
		this.collection.images = this.collection.images.filter((it) => it.id !== imageId)
		this.commandController.clearStacks()
		this.bridge.setCanUndo(this.commandController.canUndo())
		this.bridge.setCanRedo(this.commandController.canRedo())
		this.bridge.setImageCount(this.collection.images.length)
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

	private static readonly defaultViewportZoom = 1

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

	private getViewportSize(): { w: number; h: number } {
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

	private async buildPixi(): Promise<void> {
		this.teardownPixi()
		this.bridge.setCollection(this.collection.id, this.collection.name)
		this.bridge.setReady(false)

		const items = this.collection.images
		if (items.length === 0) {
			this.bridge.setImageCount(0)
			this.bridge.setReady(true)
			return
		}

		for (const im of items) {
			const r: BoardRect = { ...im.layout }
			this.images.set(im.id, new BoardImage(im.id, im.url, r))
		}

		const rects = items.map((i) => i.layout)
		const { width: ww, height: wh } = Board.worldBounds(rects)

		const viewport = this.getViewportSize()

		this.app = new Application()
		await this.app.init({
			width: viewport.w,
			height: viewport.h,
			backgroundAlpha: 0,
			antialias: true,
			resolution: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
			autoDensity: true,
		})

		const canvas = this.app.canvas as HTMLCanvasElement
		canvas.style.display = 'block'
		canvas.style.width = '100%'
		canvas.style.height = '100%'
		canvas.style.touchAction = 'none'
		this.mountEl.appendChild(canvas)

		this.worldContainer = new Container()
		this.app.stage.addChild(this.worldContainer)

		this.app.stage.eventMode = 'static'
		this.app.stage.hitArea = new Rectangle(0, 0, viewport.w, viewport.h)

		this.interactionContext = new PixiInteractionContext(this.worldContainer, this.spriteById)

		this.transformWidget = new TransformWidget()
		this.transformWidget.hide()

		this.navigationTool = new NavigationTool(
			this.worldContainer,
			canvas,
			this.app.renderer,
			() => this.getViewportSize(),
			() => ({ w: ww, h: wh }),
			() => {
				this.transformWidget?.syncFromParentSprite()
			},
			() => {
				this.autosave.schedule()
			}
		)

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

		for (const im of items) {
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
		}

		this.selectImage(null)
		const v = this.collection.viewportCenter
		const vz = this.collection.viewportZoom
		if (v !== null && vz !== null) {
			this.navigationTool.setViewportFromSaved(v, vz)
		} else {
			this.navigationTool.setViewportFromSaved(
				Board.worldBoundsCenter(rects),
				Board.defaultViewportZoom
			)
		}
		this.setupResizeObserver()
		this.bridge.setCanUndo(this.commandController.canUndo())
		this.bridge.setCanRedo(this.commandController.canRedo())
		this.bridge.setImageCount(items.length)
		this.bridge.setReady(true)
	}
}
