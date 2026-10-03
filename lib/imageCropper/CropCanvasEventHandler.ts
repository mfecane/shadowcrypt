import { CropRectController } from '~~/lib/imageCropper/CropRectController'
import type { CropCorner } from '~~/lib/imageCropper/types'
import { Container, FederatedPointerEvent, Graphics } from 'pixi.js'

const CURSOR_BY_CORNER: Record<CropCorner, string> = {
	'top-left': 'nwse-resize',
	'top-right': 'nesw-resize',
	'bottom-left': 'nesw-resize',
	'bottom-right': 'nwse-resize',
}

/**
 * Translates Pixi pointer events on the move collider, corner colliders, and
 * stage into CropRectController drag calls, and sets each collider's hover
 * cursor.
 */
export class CropCanvasEventHandler {
	private readonly onStagePointerMove = (event: FederatedPointerEvent): void => this.handlePointerMove(event)
	private readonly onStagePointerUp = (): void => this.controller.endDrag()

	public constructor(
		private readonly stage: Container,
		private readonly controller: CropRectController,
		moveCollider: Graphics,
		colliders: Record<CropCorner, Graphics>
	) {
		this.stage.eventMode = 'static'
		this.stage.on('pointermove', this.onStagePointerMove)
		this.stage.on('pointerup', this.onStagePointerUp)
		this.stage.on('pointerupoutside', this.onStagePointerUp)

		moveCollider.eventMode = 'static'
		moveCollider.cursor = 'move'
		moveCollider.on('pointerdown', (event: FederatedPointerEvent) => {
			event.stopPropagation()
			const local = event.getLocalPosition(this.stage)
			this.controller.beginMoveDrag({ x: local.x, y: local.y })
		})

		for (const [corner, collider] of Object.entries(colliders) as [CropCorner, Graphics][]) {
			collider.eventMode = 'static'
			collider.cursor = CURSOR_BY_CORNER[corner]
			collider.on('pointerdown', (event: FederatedPointerEvent) => {
				event.stopPropagation()
				this.controller.beginCornerDrag(corner)
			})
		}
	}

	public destroy(): void {
		this.stage.off('pointermove', this.onStagePointerMove)
		this.stage.off('pointerup', this.onStagePointerUp)
		this.stage.off('pointerupoutside', this.onStagePointerUp)
	}

	private handlePointerMove(event: FederatedPointerEvent): void {
		const local = event.getLocalPosition(this.stage)
		this.controller.updateDrag({ x: local.x, y: local.y })
	}
}
