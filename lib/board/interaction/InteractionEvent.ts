import type { CanvasEventType } from '~~/lib/board/interaction/CanvasEventType'
import type { PixiInteractionContext } from '~~/lib/board/interaction/PixiInteractionContext'

export interface InteractionEventModifiers {
	shift: boolean
	ctrl: boolean
	meta: boolean
	alt: boolean
}

export class InteractionEvent {
	public constructor(
		public readonly type: CanvasEventType,
		public readonly x: number,
		public readonly y: number,
		public readonly dx: number,
		public readonly dy: number,
		public readonly modifiers: InteractionEventModifiers,
		public readonly raw: PointerEvent | WheelEvent,
		public readonly context: PixiInteractionContext,
		public readonly pinchDistSqDelta?: number,
		public readonly rotationDelta?: number
	) {}
}
