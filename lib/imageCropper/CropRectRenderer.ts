import type { CropCorner, CropEdge, Rect } from '~~/lib/imageCropper/types'
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
const EDGE_HANDLE_LENGTH = 20
const EDGE_COLLIDER_LENGTH = 40
const EDGE_COLLIDER_THICKNESS = 24

/** Inward direction (toward the rect's center) along each axis, per corner. */
const CORNER_DIRECTION: Record<CropCorner, { signX: 1 | -1; signY: 1 | -1 }> = {
	'top-left': { signX: 1, signY: 1 },
	'top-right': { signX: -1, signY: 1 },
	'bottom-left': { signX: 1, signY: -1 },
	'bottom-right': { signX: -1, signY: -1 },
}

const CORNERS: CropCorner[] = ['top-left', 'top-right', 'bottom-left', 'bottom-right']
const EDGES: CropEdge[] = ['top', 'right', 'bottom', 'left']

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

function edgeMidpoint(rect: Rect, edge: CropEdge): { x: number; y: number } {
	switch (edge) {
		case 'top':
			return { x: rect.x + rect.width / 2, y: rect.y }
		case 'bottom':
			return { x: rect.x + rect.width / 2, y: rect.y + rect.height }
		case 'left':
			return { x: rect.x, y: rect.y + rect.height / 2 }
		case 'right':
			return { x: rect.x + rect.width, y: rect.y + rect.height / 2 }
	}
}

/**
 * Draws the dimmed overlay over discarded pixels, the crop rect border, the
 * visible corner and side handles, the invisible move collider covering the
 * crop rect's body, and the larger invisible corner/edge colliders used for
 * hit testing - each collider is its own Graphics so it can carry its own
 * cursor and pointerdown listener (see CropCanvasEventHandler). Colliders
 * are added move -> edge -> corner, so later (topmost in hit testing) wins
 * ties in overlapping areas: corner drags beat edge drags beat whole-rect
 * moves.
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
	public readonly edgeColliders: Record<CropEdge, Graphics> = {
		top: new Graphics(),
		right: new Graphics(),
		bottom: new Graphics(),
		left: new Graphics(),
	}

	public mount(stage: Container): void {
		stage.addChild(this.overlay, this.border, this.handles, this.moveCollider)
		for (const edge of EDGES) stage.addChild(this.edgeColliders[edge])
		for (const corner of CORNERS) stage.addChild(this.colliders[corner])
	}

	public destroy(): void {
		this.overlay.destroy()
		this.border.destroy()
		this.handles.destroy()
		this.moveCollider.destroy()
		for (const corner of CORNERS) this.colliders[corner].destroy()
		for (const edge of EDGES) this.edgeColliders[edge].destroy()
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
		for (const edge of EDGES) {
			const { x, y } = edgeMidpoint(rect, edge)
			this.drawEdgeHandle(edge, x, y)

			const collider = this.edgeColliders[edge]
			const isHorizontal = edge === 'left' || edge === 'right'
			const colliderWidth = isHorizontal ? EDGE_COLLIDER_THICKNESS : EDGE_COLLIDER_LENGTH
			const colliderHeight = isHorizontal ? EDGE_COLLIDER_LENGTH : EDGE_COLLIDER_THICKNESS
			collider.clear()
			collider.rect(x - colliderWidth / 2, y - colliderHeight / 2, colliderWidth, colliderHeight)
			collider.fill({ color: 0x000000, alpha: 0 })
		}
		this.handles.fill({ color: HANDLE_COLOR })
	}

	/** Draws a short bar centered on the edge's midpoint, inset a few pixels inside the frame. */
	private drawEdgeHandle(edge: CropEdge, x: number, y: number): void {
		if (edge === 'left' || edge === 'right') {
			const signX = edge === 'left' ? 1 : -1
			const centerX = x + HANDLE_INSET * signX
			this.handles.rect(centerX - HANDLE_THICKNESS / 2, y - EDGE_HANDLE_LENGTH / 2, HANDLE_THICKNESS, EDGE_HANDLE_LENGTH)
			return
		}
		const signY = edge === 'top' ? 1 : -1
		const centerY = y + HANDLE_INSET * signY
		this.handles.rect(x - EDGE_HANDLE_LENGTH / 2, centerY - HANDLE_THICKNESS / 2, EDGE_HANDLE_LENGTH, HANDLE_THICKNESS)
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
