import type { CropCorner, Rect } from '~~/lib/imageCropper/types'
import { Container, Graphics } from 'pixi.js'

const OVERLAY_COLOR = 0x000000
const OVERLAY_ALPHA = 0.65
const BORDER_COLOR = 0xffffff
const BORDER_WIDTH = 1
const HANDLE_COLOR = 0xffffff
const HANDLE_ARM_LENGTH = 14
const HANDLE_THICKNESS = 3
const HANDLE_INSET = 3
const COLLIDER_SIZE = 28

/** Inward direction (toward the rect's center) along each axis, per corner. */
const CORNER_DIRECTION: Record<CropCorner, { signX: 1 | -1; signY: 1 | -1 }> = {
	'top-left': { signX: 1, signY: 1 },
	'top-right': { signX: -1, signY: 1 },
	'bottom-left': { signX: 1, signY: -1 },
	'bottom-right': { signX: -1, signY: -1 },
}

const CORNERS: CropCorner[] = ['top-left', 'top-right', 'bottom-left', 'bottom-right']

function cornerPoint(rect: Rect, corner: CropCorner): { x: number; y: number } {
	switch (corner) {
		case 'top-left':
			return { x: rect.x, y: rect.y }
		case 'top-right':
			return { x: rect.x + rect.width, y: rect.y }
		case 'bottom-left':
			return { x: rect.x, y: rect.y + rect.height }
		case 'bottom-right':
			return { x: rect.x + rect.width, y: rect.y + rect.height }
	}
}

/**
 * Draws the dimmed overlay over discarded pixels, the crop rect border, the
 * visible corner handles, the invisible move collider covering the crop
 * rect's body, and the larger invisible corner colliders used for hit
 * testing - each collider is its own Graphics so it can carry its own
 * cursor and pointerdown listener (see CropCanvasEventHandler). The move
 * collider is added before the corner colliders so corner drags win in the
 * corners' overlapping area.
 */
export class CropRectRenderer {
	private readonly overlay = new Graphics()
	private readonly border = new Graphics()
	private readonly handles = new Graphics()

	public readonly moveCollider = new Graphics()
	public readonly colliders: Record<CropCorner, Graphics> = {
		'top-left': new Graphics(),
		'top-right': new Graphics(),
		'bottom-left': new Graphics(),
		'bottom-right': new Graphics(),
	}

	public mount(stage: Container): void {
		stage.addChild(this.overlay, this.border, this.handles, this.moveCollider)
		for (const corner of CORNERS) stage.addChild(this.colliders[corner])
	}

	public destroy(): void {
		this.overlay.destroy()
		this.border.destroy()
		this.handles.destroy()
		this.moveCollider.destroy()
		for (const corner of CORNERS) this.colliders[corner].destroy()
	}

	public redraw(rect: Rect, imageBounds: Rect): void {
		this.drawOverlay(rect, imageBounds)
		this.drawBorder(rect)
		this.drawMoveCollider(rect)
		this.drawHandlesAndColliders(rect)
	}

	private drawOverlay(rect: Rect, imageBounds: Rect): void {
		this.overlay.clear()
		this.overlay.rect(imageBounds.x, imageBounds.y, imageBounds.width, rect.y - imageBounds.y)
		this.overlay.rect(
			imageBounds.x,
			rect.y + rect.height,
			imageBounds.width,
			imageBounds.y + imageBounds.height - rect.y - rect.height
		)
		this.overlay.rect(imageBounds.x, rect.y, rect.x - imageBounds.x, rect.height)
		this.overlay.rect(rect.x + rect.width, rect.y, imageBounds.x + imageBounds.width - rect.x - rect.width, rect.height)
		this.overlay.fill({ color: OVERLAY_COLOR, alpha: OVERLAY_ALPHA })
	}

	private drawBorder(rect: Rect): void {
		this.border.clear()
		this.border.rect(rect.x, rect.y, rect.width, rect.height)
		this.border.stroke({ width: BORDER_WIDTH, color: BORDER_COLOR })
	}

	private drawMoveCollider(rect: Rect): void {
		this.moveCollider.clear()
		this.moveCollider.rect(rect.x, rect.y, rect.width, rect.height)
		this.moveCollider.fill({ color: 0x000000, alpha: 0 })
	}

	private drawHandlesAndColliders(rect: Rect): void {
		this.handles.clear()
		for (const corner of CORNERS) {
			const { x, y } = cornerPoint(rect, corner)
			this.drawCornerHandle(corner, x, y)

			const collider = this.colliders[corner]
			collider.clear()
			collider.rect(x - COLLIDER_SIZE / 2, y - COLLIDER_SIZE / 2, COLLIDER_SIZE, COLLIDER_SIZE)
			collider.fill({ color: 0x000000, alpha: 0 })
		}
		this.handles.fill({ color: HANDLE_COLOR })
	}

	/** Draws an L-shaped bracket at `corner`, inset a few pixels inside the frame. */
	private drawCornerHandle(corner: CropCorner, x: number, y: number): void {
		const { signX, signY } = CORNER_DIRECTION[corner]
		const originX = x + HANDLE_INSET * signX
		const originY = y + HANDLE_INSET * signY

		const armEndX = originX + HANDLE_ARM_LENGTH * signX
		this.handles.rect(
			Math.min(originX, armEndX),
			originY - HANDLE_THICKNESS / 2,
			HANDLE_ARM_LENGTH,
			HANDLE_THICKNESS
		)

		const armEndY = originY + HANDLE_ARM_LENGTH * signY
		this.handles.rect(
			originX - HANDLE_THICKNESS / 2,
			Math.min(originY, armEndY),
			HANDLE_THICKNESS,
			HANDLE_ARM_LENGTH
		)
	}
}
