import { CropCanvasEventHandler } from '~~/lib/imageCropper/CropCanvasEventHandler'
import { CropRectController } from '~~/lib/imageCropper/CropRectController'
import { CropRectRenderer } from '~~/lib/imageCropper/CropRectRenderer'
import type { CropArea, Rect } from '~~/lib/imageCropper/types'
import { Application, Sprite, Texture } from 'pixi.js'

const IMAGE_MARGIN = 24

function loadImageElement(url: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const image = new Image()
		image.crossOrigin = 'anonymous'
		image.addEventListener('load', () => resolve(image), { once: true })
		image.addEventListener('error', () => reject(new Error(`Failed to load image: ${url}`)), { once: true })
		image.src = url
	})
}

/** Fits naturalSize into the canvas inset by margin on every side, contain-style, centered. */
function fitImageBounds(canvasWidth: number, canvasHeight: number, naturalSize: { width: number; height: number }): Rect {
	const availableWidth = Math.max(canvasWidth - IMAGE_MARGIN * 2, 1)
	const availableHeight = Math.max(canvasHeight - IMAGE_MARGIN * 2, 1)
	const scale = Math.min(availableWidth / naturalSize.width, availableHeight / naturalSize.height)
	const width = naturalSize.width * scale
	const height = naturalSize.height * scale
	return { x: (canvasWidth - width) / 2, y: (canvasHeight - height) / 2, width, height }
}

/**
 * Composition root for the Pixi-powered crop canvas: sizes the canvas to the
 * source image's own aspect ratio, draws the image inset by a small margin
 * from the canvas edges, and wires the crop rect controller / renderer /
 * event handler together. Converts the controller's canvas-local crop rect
 * into natural image pixel space for consumers via addOnCropChangeListener.
 */
export class ImageCropperEngine {
	private readonly rectController: CropRectController
	private readonly renderer = new CropRectRenderer()
	private eventHandler: CropCanvasEventHandler | null = null

	private app: Application | null = null
	private sprite: Sprite | null = null
	private resizeObserver: ResizeObserver | null = null
	private naturalSize: { width: number; height: number } | null = null
	private imageBounds: Rect = { x: 0, y: 0, width: 0, height: 0 }

	private readonly cropChangeCallbacks: Set<(area: CropArea) => void> = new Set()
	private readonly readyCallbacks: Set<(naturalAspectRatio: number) => void> = new Set()

	// Vue can mount -> unmount -> mount in quick succession (e.g. v-if toggling),
	// and destroy() can land before the awaits below resolve, when there's nothing yet to tear down.
	private destroyed = false

	public constructor(aspectRatio: number | null) {
		this.rectController = new CropRectController(aspectRatio)
	}

	public addOnCropChangeListener(callback: (area: CropArea) => void): AbortController {
		this.cropChangeCallbacks.add(callback)
		const controller = new AbortController()
		controller.signal.addEventListener('abort', () => this.cropChangeCallbacks.delete(callback))
		return controller
	}

	public addOnReadyListener(callback: (naturalAspectRatio: number) => void): AbortController {
		this.readyCallbacks.add(callback)
		const controller = new AbortController()
		controller.signal.addEventListener('abort', () => this.readyCallbacks.delete(callback))
		return controller
	}

	public async mount(container: HTMLElement, imageUrl: string): Promise<void> {
		const image = await loadImageElement(imageUrl)
		if (this.destroyed) return

		const texture: Texture = Texture.from(image)
		this.naturalSize = { width: image.naturalWidth, height: image.naturalHeight }
		for (const callback of this.readyCallbacks) callback(this.naturalSize.width / this.naturalSize.height)

		const app = new Application()
		await app.init({ backgroundAlpha: 0, antialias: true })
		if (this.destroyed) {
			app.destroy(true, { children: true, texture: true })
			return
		}
		this.app = app
		app.canvas.style.width = '100%'
		app.canvas.style.height = '100%'
		app.canvas.style.display = 'block'
		container.appendChild(app.canvas)

		this.sprite = new Sprite(texture)
		app.stage.addChild(this.sprite)

		this.renderer.mount(app.stage)
		this.eventHandler = new CropCanvasEventHandler(
			app.stage,
			this.rectController,
			this.renderer.moveCollider,
			this.renderer.colliders,
			this.renderer.edgeColliders
		)
		this.rectController.addOnChangeListener((rect) => {
			this.renderer.redraw(rect, this.imageBounds)
			this.emitCropChange(rect)
		})

		this.resizeObserver = new ResizeObserver((entries) => {
			const entry = entries[0]
			if (entry === undefined) return
			const { width, height } = entry.contentRect
			this.layout(width, height)
		})
		this.resizeObserver.observe(container)
	}

	public destroy(): void {
		this.destroyed = true
		this.resizeObserver?.disconnect()
		this.resizeObserver = null
		this.eventHandler?.destroy()
		this.eventHandler = null
		this.renderer.destroy()
		this.app?.destroy(true, { children: true, texture: true })
		this.app = null
	}

	private layout(width: number, height: number): void {
		if (!this.app || !this.sprite || !this.naturalSize || width === 0 || height === 0) return
		this.app.renderer.resize(width, height)
		this.app.stage.hitArea = this.app.screen

		this.imageBounds = fitImageBounds(width, height, this.naturalSize)
		this.sprite.x = this.imageBounds.x
		this.sprite.y = this.imageBounds.y
		this.sprite.width = this.imageBounds.width
		this.sprite.height = this.imageBounds.height

		this.rectController.setImageBounds(this.imageBounds)
	}

	private emitCropChange(rect: Rect): void {
		if (!this.naturalSize || this.imageBounds.width === 0) return
		const scale = this.imageBounds.width / this.naturalSize.width
		const area: CropArea = {
			x: (rect.x - this.imageBounds.x) / scale,
			y: (rect.y - this.imageBounds.y) / scale,
			width: rect.width / scale,
			height: rect.height / scale,
		}
		for (const callback of this.cropChangeCallbacks) callback(area)
	}
}
