import { Point, Sprite, type Container } from 'pixi.js'
import { TransformWidget } from '~~/lib/board/interaction/widgets/TransformWidget'
import type { WidgetPart } from '~~/lib/board/interaction/widgets/WidgetPart'

export const enum HitKind {
	none = 'none',
	sprite = 'sprite',
	widget = 'widget',
}

export interface HitResult {
	kind: HitKind
	imageId?: string
	sprite?: Sprite
	widgetPart?: WidgetPart
}

export class PixiInteractionContext {
	public hitResult: HitResult = { kind: HitKind.none }

	public constructor(
		private readonly worldContainer: Container,
		private readonly spriteById: Map<string, Sprite>
	) {}

	/** `rx`/`ry` must be Pixi global coords (same space as `renderer.screen`, NavigationTool focal). */
	public updateHitFromRendererCoords(rx: number, ry: number): void {
		const global = new Point(rx, ry)
		const children = [...this.worldContainer.children].reverse()
		for (const child of children) {
			if (!(child instanceof Sprite)) {
				continue
			}
			if (!child.visible) {
				continue
			}
			for (const w of child.children) {
				if (w instanceof TransformWidget && w.visible) {
					const part = w.hitTestGlobal(global)
					if (part !== null) {
						for (const [id, sp] of this.spriteById) {
							if (sp === child) {
								this.hitResult = {
									kind: HitKind.widget,
									imageId: id,
									sprite: child,
									widgetPart: part,
								}
								return
							}
						}
					}
				}
			}
			if (child.eventMode === 'none') {
				continue
			}
			const local = child.toLocal(global)
			if (child.containsPoint(local)) {
				for (const [id, sp] of this.spriteById) {
					if (sp === child) {
						this.hitResult = { kind: HitKind.sprite, imageId: id, sprite: child }
						return
					}
				}
			}
		}
		this.hitResult = { kind: HitKind.none }
	}

	public clearHit(): void {
		this.hitResult = { kind: HitKind.none }
	}
}
