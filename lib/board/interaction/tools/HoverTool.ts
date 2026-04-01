import { CanvasEventType } from '~~/lib/board/interaction/CanvasEventType'
import type { InteractionEvent } from '~~/lib/board/interaction/InteractionEvent'
import { InteractionHandlerResult } from '~~/lib/board/interaction/InteractionHandlerResult'
import { HitKind } from '~~/lib/board/interaction/PixiInteractionContext'
import type { Tool } from '~~/lib/board/interaction/Tool'
import { WidgetCorner, type WidgetPart } from '~~/lib/board/interaction/widgets/WidgetPart'

function cursorForWidgetPart(part: WidgetPart): string {
	if (part === 'body') {
		return 'move'
	}
	if (part === WidgetCorner.nw || part === WidgetCorner.se) {
		return 'nwse-resize'
	}
	return 'nesw-resize'
}

export class HoverTool implements Tool {
	public readonly id = 'hover'

	public readonly priority = 70

	public enabled = true

	public constructor(private readonly canvas: HTMLCanvasElement) {}

	public isEnabled(event: InteractionEvent): boolean {
		return this.enabled && event.type === CanvasEventType.Hover
	}

	public async onEvent(event: InteractionEvent): Promise<InteractionHandlerResult> {
		const r = new InteractionHandlerResult()
		if (event.type !== CanvasEventType.Hover) {
			return r
		}
		const hit = event.context.hitResult
		let cursor = 'default'
		if (hit.kind === HitKind.widget && hit.widgetPart !== undefined) {
			cursor = cursorForWidgetPart(hit.widgetPart)
		} else if (hit.kind === HitKind.sprite) {
			cursor = 'pointer'
		}
		this.canvas.style.cursor = cursor
		return r.setHandled()
	}
}
