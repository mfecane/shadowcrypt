import { CanvasEventType } from '~~/lib/board/interaction/CanvasEventType'
import type { InteractionEvent } from '~~/lib/board/interaction/InteractionEvent'
import { InteractionHandlerResult } from '~~/lib/board/interaction/InteractionHandlerResult'
import { HitKind } from '~~/lib/board/interaction/PixiInteractionContext'
import type { Tool } from '~~/lib/board/interaction/Tool'
import type { Board } from '~~/lib/board/Board'

export class SelectTool implements Tool {
	public readonly id = 'select'

	public readonly priority = 50

	public enabled = true

	public constructor(private readonly board: Board) {}

	public isEnabled(event: InteractionEvent): boolean {
		return this.enabled && event.type === CanvasEventType.Click
	}

	public async onEvent(event: InteractionEvent): Promise<InteractionHandlerResult> {
		const r = new InteractionHandlerResult()
		if (event.type !== CanvasEventType.Click) {
			return r
		}
		const hit = event.context.hitResult
		if (hit.kind === HitKind.widget) {
			return r.setHandled()
		}
		if (hit.kind === HitKind.sprite && hit.imageId !== undefined) {
			this.board.selectImage(hit.imageId)
			return r.setHandled()
		}
		this.board.selectImage(null)
		return r.setHandled()
	}
}
