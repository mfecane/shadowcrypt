import type { Sprite } from 'pixi.js'
import type { BoardImageLayout } from '~~/lib/board/BoardImageLayout'
import type { WidgetCorner } from '~~/lib/board/interaction/widgets/WidgetPart'

export interface Rect {
	x: number
	y: number
	w: number
	h: number
}

/** Ghost geometry/identity captured once a translate gesture crosses out of the canvas. */
export interface DragOutGhost {
	thumbnailUrl: string
	width: number
	height: number
	grabOffsetX: number
	grabOffsetY: number
}

/**
 * Everything one active pointer-captured gesture needs, as a single tagged value instead of a
 * pile of independently-mutated fields. Handlers narrow on `kind` and get exactly the fields that
 * variant has — there is no "translate but startRect is set" or "out-of-canvas but dragOut is
 * null" to guard against, because those states are not representable.
 */
export type DragGesture =
	| { kind: 'idle' }
	| {
			kind: 'translate'
			sprite: Sprite
			imageId: string
			pointerId: number
			startSnapshot: BoardImageLayout
			/** Whether the pointer is currently past the canvas's DOM bounds (drag-out-of-canvas UI is live). */
			location: 'in-canvas' | 'out-of-canvas'
			/** Set once the gesture crosses out of the canvas; cleared on re-entry. */
			dragOut: DragOutGhost | null
	  }
	| {
			kind: 'scale'
			sprite: Sprite
			imageId: string
			pointerId: number
			startSnapshot: BoardImageLayout
			corner: WidgetCorner
			startRect: Rect
	  }

export const IDLE_GESTURE: DragGesture = { kind: 'idle' }

/**
 * Persistent info per gesture (group of events), carried on {@link InteractionEvent.context} for
 * the life of one pointer-captured interaction. Unlike {@link InteractionInfo} — which is
 * re-derived from scratch on every event — this is the handler's own memory across a span of
 * events: set at `MoveStart`, read and refined on each `Move`, consumed at `MoveEnd`.
 */
export class InteractionContext {
	public gesture: DragGesture = IDLE_GESTURE
}
