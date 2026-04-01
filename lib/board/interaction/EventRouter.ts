import type { InteractionEvent } from '~~/lib/board/interaction/InteractionEvent'
import type { InteractionHandlerResult } from '~~/lib/board/interaction/InteractionHandlerResult'
import type { Tool } from '~~/lib/board/interaction/Tool'

export class EventRouter {
	private capturedToolId: string | null = null

	public constructor(private handlers: Tool[]) {
		this.handlers = this.orderHandlers(this.handlers)
	}

	public async dispatch(event: InteractionEvent): Promise<void> {
		const captured = this.getCapturedHandler()
		if (captured) {
			await this.dispatchToHandler(captured, event)
			return
		}

		for (const handler of this.handlers) {
			if (!handler.isEnabled(event)) {
				continue
			}
			const result: InteractionHandlerResult = await this.dispatchToHandler(handler, event)
			if (result.handled || result.capture || result.releaseCapture) {
				return
			}
		}
	}

	public enableHandler(handlerId: string): void {
		const handler = this.getHandlerById(handlerId)
		if (handler) {
			handler.enabled = true
		}
	}

	public disableHandler(handlerId: string): void {
		const handler = this.getHandlerById(handlerId)
		if (handler) {
			handler.enabled = false
		}
	}

	private getCapturedHandler(): Tool | null {
		if (this.capturedToolId === null) {
			return null
		}
		return this.getHandlerById(this.capturedToolId)
	}

	private orderHandlers(handlers: Tool[]): Tool[] {
		return [...handlers].sort((a, b) => b.priority - a.priority)
	}

	private getHandlerById(id: string): Tool | null {
		return this.handlers.find((handler) => handler.id === id) ?? null
	}

	private async dispatchToHandler(handler: Tool, event: InteractionEvent): Promise<InteractionHandlerResult> {
		const result: InteractionHandlerResult = await handler.onEvent(event)

		if (result.capture) {
			this.capturedToolId = handler.id
		}

		if (result.releaseCapture) {
			this.capturedToolId = null
		}

		return result
	}
}
