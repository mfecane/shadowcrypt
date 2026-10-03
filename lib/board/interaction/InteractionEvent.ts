import type { CanvasEventType } from '~~/lib/board/interaction/CanvasEventType'
import type { InteractionContext } from '~~/lib/board/interaction/InteractionContext'
import type { InteractionInfo } from '~~/lib/board/interaction/InteractionInfo'

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
		public readonly raw: PointerEvent | WheelEvent | KeyboardEvent,
		public readonly info: InteractionInfo,
		public readonly context: InteractionContext,
		public readonly pinchDistSqDelta?: number,
		public readonly rotationDelta?: number
	) {}
}
