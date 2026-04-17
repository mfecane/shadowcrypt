import { Application, Assets, Container, Rectangle, Sprite } from 'pixi.js'
import type { BoardHost } from '~~/lib/board/BoardHost'
import type { BoardImage } from '~~/lib/board/BoardImage'
import { BoardImageLayout } from '~~/lib/board/BoardImageLayout'
import { EventPreprocessor } from '~~/lib/board/interaction/EventPreprocessor'
import { EventRouter } from '~~/lib/board/interaction/EventRouter'
import { PixiInteractionContext } from '~~/lib/board/interaction/PixiInteractionContext'
import { FullscreenTool } from '~~/lib/board/interaction/tools/FullscreenTool'
import { HoverTool } from '~~/lib/board/interaction/tools/HoverTool'
import { NavigationTool } from '~~/lib/board/interaction/tools/NavigationTool'
import { SelectTool } from '~~/lib/board/interaction/tools/SelectTool'
import { TransformTool } from '~~/lib/board/interaction/tools/TransformTool'
import { TransformWidget } from '~~/lib/board/interaction/widgets/TransformWidget'

/** Interactive canvas: world container, image sprites, resize wiring, and the tool stack. */
export class BoardRenderer {
	public navigationTool: NavigationTool | null = null

	private app: Application | null = null
	private worldContainer: Container | null = null
	private preprocessor: EventPreprocessor | null = null
	private router: EventRouter | null = null
	private interactionContext: PixiInteractionContext | null = null
	private resizeObserver: ResizeObserver | null = null
	private readonly spriteById = new Map<string, Sprite>()
	private transformWidget: TransformWidget | null = null

	public constructor(
		private readonly mountEl: HTMLElement,
		private readonly host: BoardHost,
		private readonly log: (line: string) => void
	) {}

	private static spriteBaseSize(sprite: Sprite): { width: number; height: number } {
		const texture = sprite.texture
		return {
			width: texture.orig.width > 0 ? texture.orig.width : texture.width,
			height: texture.orig.height > 0 ? texture.orig.height : texture.height,
		}
	}

	public static signedSnapshotFromSprite(sprite: Sprite): BoardImageLayout {
		const base = BoardRenderer.spriteBaseSize(sprite)
		const w = Math.abs(sprite.scale.x * base.width)
		const h = Math.abs(sprite.scale.y * base.height)
		const flipX = sprite.scale.x < 0
		const flipY = sprite.scale.y < 0
		return new BoardImageLayout(
			sprite.zIndex,
			flipX ? sprite.x - w : sprite.x,
			flipY ? sprite.y - h : sprite.y,
			w,
			h,
			flipX,
			flipY
		)
	}

	public static applySnapshotToSprite(sprite: Sprite, snapshot: BoardImageLayout): void {
		const base = BoardRenderer.spriteBaseSize(sprite)
		const safeBaseW = Math.max(1e-6, base.width)
		const safeBaseH = Math.max(1e-6, base.height)
		const scaleX = Math.abs(snapshot.w) / safeBaseW
		const scaleY = Math.abs(snapshot.h) / safeBaseH
		sprite.scale.x = snapshot.flipX ? -scaleX : scaleX
		sprite.scale.y = snapshot.flipY ? -scaleY : scaleY
		sprite.x = snapshot.flipX ? snapshot.x + Math.abs(snapshot.w) : snapshot.x
		sprite.y = snapshot.flipY ? snapshot.y + Math.abs(snapshot.h) : snapshot.y
	}

	public getSprite(imageId: string): Sprite | undefined {
		return this.spriteById.get(imageId)
	}

	public applySnapshotToSprite(imageId: string, snapshot: BoardImageLayout): void {
		const sp = this.spriteById.get(imageId)
		if (sp === undefined) {
			return
		}
		BoardRenderer.applySnapshotToSprite(sp, snapshot)
	}

	public setSpriteWorldZIndex(imageId: string, zIndex: number): void {
		const sp = this.spriteById.get(imageId)
		if (sp !== undefined) {
			sp.zIndex = zIndex
		}
	}

	public sortWorldChildren(): void {
		this.worldContainer?.sortChildren()
	}

	public removeSprite(imageId: string): void {
		const sp = this.spriteById.get(imageId)
		if (sp === undefined || this.worldContainer === null) {
			return
		}
		this.worldContainer.removeChild(sp)
		sp.destroy({ texture: true })
		this.spriteById.delete(imageId)
	}

	public syncTransformWidgetFromParentSprite(): void {
		this.transformWidget?.syncFromParentSprite()
	}

	public syncTransformWidget(selectedImageId: string | null): void {
		const widget = this.transformWidget
		const world = this.worldContainer
		if (widget === null || world === null) {
			return
		}
		if (widget.parent !== null) {
			widget.parent.removeChild(widget)
		}
		if (selectedImageId === null) {
			widget.hide()
			return
		}
		const sp = this.spriteById.get(selectedImageId)
		if (sp === undefined) {
			widget.hide()
			return
		}
		sp.addChild(widget)
		widget.show()
		widget.syncFromParentSprite()
	}

	public async mount(
		sortedImages: BoardImage[],
		initialViewportCenter: { x: number; y: number },
		initialViewportZoom: number
	): Promise<void> {
		this.destroy()

		const viewport = this.host.getViewportSize()
		this.log(`viewport ${Math.round(viewport.w)}x${Math.round(viewport.h)}`)

		this.app = new Application()
		this.log('initializing view layer')
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
			this.log(`app.init failed: ${error instanceof Error ? error.message : String(error)}`)
			throw error
		}
		this.log('view layer initialized')

		const canvas = this.app.canvas as HTMLCanvasElement
		canvas.style.display = 'block'
		canvas.style.width = '100%'
		canvas.style.height = '100%'
		canvas.style.touchAction = 'none'
		this.mountEl.appendChild(canvas)
		this.log('canvas attached to mount element')

		this.worldContainer = new Container()
		this.worldContainer.sortableChildren = true
		this.app.stage.addChild(this.worldContainer)

		this.app.stage.eventMode = 'static'
		this.app.stage.hitArea = new Rectangle(0, 0, viewport.w, viewport.h)

		this.interactionContext = new PixiInteractionContext(this.worldContainer, this.spriteById)

		this.transformWidget = new TransformWidget()
		this.transformWidget.hide()

		this.navigationTool = new NavigationTool(this.worldContainer, canvas, this.app.renderer, this.host)

		this.router = new EventRouter([
			new HoverTool(canvas),
			new FullscreenTool(this.host),
			new TransformTool(this.worldContainer, canvas, this.host, () => this.transformWidget),
			new SelectTool(this.host),
			this.navigationTool,
		])

		this.preprocessor = new EventPreprocessor(canvas, this.app.renderer, this.interactionContext, (e) =>
			this.router!.dispatch(e)
		)
		this.preprocessor.attach()
		this.log('interaction stack attached')

		for (const [index, im] of sortedImages.entries()) {
			this.log(`loading image ${index + 1}/${sortedImages.length} id=${im.id}`)
			try {
				const texture = await Assets.load(im.src)
				im.width = texture.width
				im.height = texture.height
				const sprite = new Sprite(texture)
				const L = im.layout
				const flipX = L.flipX
				const flipY = L.flipY
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
				this.log(
					`image ready ${index + 1}/${sortedImages.length} id=${im.id} tex=${texture.width}x${texture.height}`
				)
			} catch (error) {
				this.log(
					`image failed ${index + 1}/${sortedImages.length} id=${im.id}: ${
						error instanceof Error ? error.message : String(error)
					}`
				)
				throw error
			}
		}
		this.log(`all sprites created count=${this.spriteById.size}`)
		this.worldContainer.sortChildren()

		this.navigationTool.setViewportFromSaved(initialViewportCenter, initialViewportZoom)
		this.log('viewport initialized')

		this.setupResizeObserver()
		this.log('resize observer attached')
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

	public destroy(): void {
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
		if (this.app !== null) {
			this.app.destroy(true)
			this.app = null
		}
	}
}
