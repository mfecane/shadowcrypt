import { Point, Sprite, type Container } from 'pixi.js'
import { BoardDropTargetRepository } from '~~/lib/board/interaction/BoardDropTargetRepository'
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

/**
 * Re-derived from scratch on every single event — "what's under the pointer right now": hit test
 * result, canvas-edge clearance, DOM drop target. Carried on {@link InteractionEvent.info}. Has no
 * memory of its own between events; a gesture's memory across a span of events belongs on
 * {@link InteractionContext} instead.
 */
export class InteractionInfo {
	public hitResult: HitResult = { kind: HitKind.none }

	/** Px of clearance to the nearest canvas edge; negative once the pointer has moved past it. */
	public pointerInsetFromCanvasPx = 0

	/**
	 * Board id of the DOM drop target under the pointer, if any. Tested unconditionally, not gated
	 * on {@link pointerInsetFromCanvasPx} — the boards panel overlays the canvas rather than
	 * shrinking it, so the pointer can be over a drop target while still geometrically "inside" the
	 * canvas's own DOM rect.
	 */
	public dropTargetBoardId: string | null = null

	public constructor(
		private readonly worldContainer: Container,
		private readonly spriteById: Map<string, Sprite>,
		private readonly canvas: HTMLCanvasElement,
		private readonly dropTargets: BoardDropTargetRepository
	) {}

	/** Rebuilds the cross-board drop-target candidate list; call on drag start and panel open/close. */
	public rebuildDropTargets(): void {
		this.dropTargets.rebuild()
	}

	/** Client-space pointer location vs. the canvas bounds and any DOM drop target under it. */
	public updatePointerLocation(clientX: number, clientY: number): void {
		const rect = this.canvas.getBoundingClientRect()
		const insetX = Math.min(clientX - rect.left, rect.right - clientX)
		const insetY = Math.min(clientY - rect.top, rect.bottom - clientY)
		this.pointerInsetFromCanvasPx = Math.min(insetX, insetY)
		this.dropTargetBoardId = this.dropTargets.hitTest(clientX, clientY)
	}

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
