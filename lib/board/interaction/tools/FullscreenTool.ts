import { CanvasEventType } from '~~/lib/board/interaction/CanvasEventType'
import type { InteractionEvent } from '~~/lib/board/interaction/InteractionEvent'
import { InteractionHandlerResult } from '~~/lib/board/interaction/InteractionHandlerResult'
import { HitKind } from '~~/lib/board/interaction/PixiInteractionContext'
import type { Tool } from '~~/lib/board/interaction/Tool'
import type { Board } from '~~/lib/board/Board'

export class FullscreenTool implements Tool {
	public readonly id = 'fullscreen'

	public readonly priority = 60

	public enabled = true

	public constructor(private readonly board: Board) {}

	public isEnabled(event: InteractionEvent): boolean {
		return this.enabled && event.type === CanvasEventType.DoubleClick
	}

	public async onEvent(event: InteractionEvent): Promise<InteractionHandlerResult> {
		const r = new InteractionHandlerResult()
		if (event.type !== CanvasEventType.DoubleClick) {
			return r
		}
		const hit = event.context.hitResult
		if ((hit.kind === HitKind.sprite || hit.kind === HitKind.widget) && hit.imageId !== undefined) {
			this.board.openFullscreenById(hit.imageId)
			return r.setHandled()
		}
		return r
	}
}
