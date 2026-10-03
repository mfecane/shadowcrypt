import type { CropCorner, Point, Rect } from '~~/lib/imageCropper/types'

const MIN_CROP_SIZE = 32

const OPPOSITE_CORNER: Record<CropCorner, CropCorner> = {
	'top-left': 'bottom-right',
	'top-right': 'bottom-left',
	'bottom-left': 'top-right',
	'bottom-right': 'top-left',
}

type DragState = { mode: 'resize'; corner: CropCorner; anchor: Point } | { mode: 'move'; pointerOffset: Point } | null

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value))

/**
 * Owns the crop rectangle's geometry in canvas-local pixel space: the initial
 * centered rect at the fixed aspect ratio, corner-drag resizing that keeps
 * that aspect ratio, and whole-rect dragging to reposition it - all clamped
 * to the drawn image's bounds (not the raw canvas, which is inset by a
 * margin - see ImageCropperEngine). Knows nothing about Pixi or rendering -
 * CropRectRenderer reads getRect() to draw.
 */
export class CropRectController {
	private rect: Rect = { x: 0, y: 0, width: 0, height: 0 }
	private imageBounds: Rect = { x: 0, y: 0, width: 0, height: 0 }
	private drag: DragState = null

	private readonly callbacks: Set<(rect: Rect) => void> = new Set()

	/** `aspectRatio === null` means freeform: corner drags resize both axes independently. */
	public constructor(private readonly aspectRatio: number | null) {}

	public addOnChangeListener(callback: (rect: Rect) => void): AbortController {
		this.callbacks.add(callback)
		const controller = new AbortController()
		controller.signal.addEventListener('abort', () => this.callbacks.delete(callback))
		return controller
	}

	public getRect(): Rect {
		return this.rect
	}

	/**
	 * (Re)centers a default crop rect on first layout, or rescales the existing
	 * one proportionally when the image bounds change after the crop was already placed.
	 */
	public setImageBounds(bounds: Rect): void {
		const isFirstLayout = this.imageBounds.width === 0 && this.imageBounds.height === 0
		if (isFirstLayout) {
			this.rect = this.centeredDefaultRect(bounds)
		} else {
			const scaleX = bounds.width / this.imageBounds.width
			const scaleY = bounds.height / this.imageBounds.height
			this.rect = {
				x: bounds.x + (this.rect.x - this.imageBounds.x) * scaleX,
				y: bounds.y + (this.rect.y - this.imageBounds.y) * scaleY,
				width: this.rect.width * scaleX,
				height: this.rect.height * scaleY,
			}
		}
		this.imageBounds = bounds
		this.notify()
	}

	public beginCornerDrag(corner: CropCorner): void {
		this.drag = { mode: 'resize', corner, anchor: this.cornerPoint(OPPOSITE_CORNER[corner]) }
	}

	public beginMoveDrag(pointer: Point): void {
		this.drag = { mode: 'move', pointerOffset: { x: pointer.x - this.rect.x, y: pointer.y - this.rect.y } }
	}

	public updateDrag(pointer: Point): void {
		if (!this.drag) return
		this.rect = this.drag.mode === 'resize' ? this.resizeFromAnchor(this.drag.anchor, pointer) : this.moveTo(pointer, this.drag.pointerOffset)
		this.notify()
	}

	public endDrag(): void {
		this.drag = null
	}

	private centeredDefaultRect(bounds: Rect): Rect {
		if (this.aspectRatio === null) {
			return { ...bounds }
		}
		const width = Math.min(bounds.width, bounds.height * this.aspectRatio)
		const height = width / this.aspectRatio
		return { x: bounds.x + (bounds.width - width) / 2, y: bounds.y + (bounds.height - height) / 2, width, height }
	}

	private cornerPoint(corner: CropCorner): Point {
		const { x, y, width, height } = this.rect
		switch (corner) {
			case 'top-left':
				return { x, y }
			case 'top-right':
				return { x: x + width, y }
			case 'bottom-left':
				return { x, y: y + height }
			case 'bottom-right':
				return { x: x + width, y: y + height }
		}
	}

	private resizeFromAnchor(anchor: Point, pointer: Point): Rect {
		const bounds = this.imageBounds
		const clampedPointer = {
			x: clamp(pointer.x, bounds.x, bounds.x + bounds.width),
			y: clamp(pointer.y, bounds.y, bounds.y + bounds.height),
		}
		const dx = clampedPointer.x - anchor.x
		const dy = clampedPointer.y - anchor.y

		const width = this.aspectRatio === null ? Math.max(Math.abs(dx), MIN_CROP_SIZE) : Math.max(Math.min(Math.abs(dx), Math.abs(dy) * this.aspectRatio), MIN_CROP_SIZE)
		const height = this.aspectRatio === null ? Math.max(Math.abs(dy), MIN_CROP_SIZE) : width / this.aspectRatio

		const signX = dx < 0 ? -1 : 1
		const signY = dy < 0 ? -1 : 1
		const cornerX = clamp(anchor.x + signX * width, bounds.x, bounds.x + bounds.width)
		const cornerY = clamp(anchor.y + signY * height, bounds.y, bounds.y + bounds.height)

		return {
			x: Math.min(anchor.x, cornerX),
			y: Math.min(anchor.y, cornerY),
			width: Math.abs(cornerX - anchor.x),
			height: Math.abs(cornerY - anchor.y),
		}
	}

	private moveTo(pointer: Point, pointerOffset: Point): Rect {
		const bounds = this.imageBounds
		const x = clamp(pointer.x - pointerOffset.x, bounds.x, bounds.x + bounds.width - this.rect.width)
		const y = clamp(pointer.y - pointerOffset.y, bounds.y, bounds.y + bounds.height - this.rect.height)
		return { ...this.rect, x, y }
	}

	private notify(): void {
		for (const callback of this.callbacks) callback(this.rect)
	}
}
