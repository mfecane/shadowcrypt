import type { InteractionEvent } from '~~/lib/board/interaction/InteractionEvent'
import type { InteractionHandlerResult } from '~~/lib/board/interaction/InteractionHandlerResult'

export interface Tool {
	readonly id: string

	readonly priority: number

	enabled: boolean

	isEnabled(event: InteractionEvent): boolean

	onEvent(event: InteractionEvent): Promise<InteractionHandlerResult>
}
