import type { Container } from 'pixi.js'
import { Point, Sprite } from 'pixi.js'
import { CanvasEventType } from '~~/lib/board/interaction/CanvasEventType'
import type { InteractionEvent } from '~~/lib/board/interaction/InteractionEvent'
import { InteractionHandlerResult } from '~~/lib/board/interaction/InteractionHandlerResult'
import { HitKind } from '~~/lib/board/interaction/PixiInteractionContext'
import type { Tool } from '~~/lib/board/interaction/Tool'
import { TransformWidget } from '~~/lib/board/interaction/widgets/TransformWidget'
import { WidgetCorner } from '~~/lib/board/interaction/widgets/WidgetPart'
import { clamp } from '~~/lib/collectionViewer/viewerUtils'
import type { ViewerSpriteSnapshot } from '~~/lib/collectionViewer/commands/ImageTransformCommand'

const MIN_SPRITE_SIZE = 16

function globalDeltaToParentLocal(container: Container, dx: number, dy: number): { x: number; y: number } {
	const wt = container.worldTransform
	const det = wt.a * wt.d - wt.b * wt.c
	if (Math.abs(det) < 1e-12) {
		return { x: 0, y: 0 }
	}
	const invA = wt.d / det
	const invB = -wt.b / det
	const invC = -wt.c / det
	const invD = wt.a / det
	return {
		x: invA * dx + invC * dy,
		y: invB * dx + invD * dy,
	}
}

export class TransformTool implements Tool {
	public readonly id = 'transform'

	public readonly priority = 55

	public enabled = true

	private mode: 'translate' | 'scale' | null = null

	private scaleCorner: WidgetCorner | null = null

	private startRect: { x: number; y: number; w: number; h: number } | null = null

	private capturePointerId: number | null = null

	private dragSprite: Sprite | null = null

	private dragImageId: string | null = null

	private startSnapshot: ViewerSpriteSnapshot | null = null

	public constructor(
		private readonly worldContainer: Container,
		private readonly canvas: HTMLCanvasElement,
		private readonly getWidget: () => TransformWidget | null,
		private readonly onTransform: () => void,
		private readonly onTouchImage: (imageId: string) => void,
		private readonly onCommit: (imageId: string, before: ViewerSpriteSnapshot, after: ViewerSpriteSnapshot) => void
	) {}

	public isEnabled(event: InteractionEvent): boolean {
		if (!this.enabled) {
			return false
		}
		switch (event.type) {
			case CanvasEventType.MoveStart:
			case CanvasEventType.Move:
			case CanvasEventType.MoveEnd:
				return true
			default:
				return false
		}
	}

	public async onEvent(event: InteractionEvent): Promise<InteractionHandlerResult> {
		switch (event.type) {
			case CanvasEventType.MoveStart:
				return this.onMoveStart(event)
			case CanvasEventType.Move:
				return this.onMove(event)
			case CanvasEventType.MoveEnd:
				return this.onMoveEnd(event)
			default:
				return new InteractionHandlerResult()
		}
	}

	private onMoveStart(event: InteractionEvent): InteractionHandlerResult {
		const r = new InteractionHandlerResult()
		const h = event.context.hitResult
		if (
			h.kind !== HitKind.widget ||
			h.widgetPart === undefined ||
			h.sprite === undefined ||
			h.imageId === undefined
		) {
			return r
		}
		this.dragSprite = h.sprite
		this.dragImageId = h.imageId
		this.onTouchImage(h.imageId)
		this.startSnapshot = { x: h.sprite.x, y: h.sprite.y, width: h.sprite.width, height: h.sprite.height }
		const part = h.widgetPart
		const raw = event.raw as PointerEvent
		if (part === 'body') {
			this.mode = 'translate'
		} else {
			this.mode = 'scale'
			this.scaleCorner = part
			const sp = h.sprite
			const vr = TransformWidget.getVisualRect(sp)
			const tl = this.worldContainer.toLocal(sp.toGlobal(new Point(vr.x, vr.y)))
			const br = this.worldContainer.toLocal(sp.toGlobal(new Point(vr.x + vr.w, vr.y + vr.h)))
			this.startRect = {
				x: Math.min(tl.x, br.x),
				y: Math.min(tl.y, br.y),
				w: Math.abs(br.x - tl.x),
				h: Math.abs(br.y - tl.y),
			}
		}
		this.capturePointerId = raw.pointerId
		this.canvas.setPointerCapture(raw.pointerId)
		return r.setCapture()
	}

	private onMove(event: InteractionEvent): InteractionHandlerResult {
		const r = new InteractionHandlerResult()
		if (this.mode === null || this.capturePointerId === null) {
			return r
		}
		const raw = event.raw as PointerEvent
		if (raw.pointerId !== this.capturePointerId) {
			return r
		}
		const sprite = this.dragSprite
		if (sprite === null) {
			return r
		}

		if (this.mode === 'translate') {
			const ld = globalDeltaToParentLocal(this.worldContainer, event.dx, event.dy)
			sprite.x += ld.x
			sprite.y += ld.y
			this.getWidget()?.syncFromParentSprite()
			this.onTransform()
			return r.setHandled()
		}

		if (this.mode === 'scale' && this.scaleCorner !== null && this.startRect !== null) {
			const global = new Point(event.x, event.y)
			const p = this.worldContainer.toLocal(global)
			const s = this.startRect
			const min = MIN_SPRITE_SIZE
			const ratio = s.h !== 0 ? s.w / s.h : 1
			switch (this.scaleCorner) {
				case WidgetCorner.nw: {
					const ax = s.x + s.w
					const ay = s.y + s.h
					const dx = ax - p.x
					const dy = ay - p.y
					const w = clamp(Math.min(dx, dy * ratio), min, 1e6)
					const h = clamp(w / ratio, min, 1e6)
					sprite.x = ax - w
					sprite.y = ay - h
					sprite.width = w
					sprite.height = h
					break
				}
				case WidgetCorner.ne: {
					const bottomY = s.y + s.h
					const dx = p.x - s.x
					const dy = bottomY - p.y
					const w = clamp(Math.min(dx, dy * ratio), min, 1e6)
					const h = clamp(w / ratio, min, 1e6)
					sprite.x = s.x
					sprite.y = bottomY - h
					sprite.width = w
					sprite.height = h
					break
				}
				case WidgetCorner.se: {
					const dx = p.x - s.x
					const dy = p.y - s.y
					const w = clamp(Math.min(dx, dy * ratio), min, 1e6)
					const h = clamp(w / ratio, min, 1e6)
					sprite.x = s.x
					sprite.y = s.y
					sprite.width = w
					sprite.height = h
					break
				}
				case WidgetCorner.sw: {
					const rightX = s.x + s.w
					const dx = rightX - p.x
					const dy = p.y - s.y
					const w = clamp(Math.min(dx, dy * ratio), min, 1e6)
					const h = clamp(w / ratio, min, 1e6)
					sprite.x = rightX - w
					sprite.y = s.y
					sprite.width = w
					sprite.height = h
					break
				}
				default:
					break
			}
			this.getWidget()?.syncFromParentSprite()
			this.onTransform()
			return r.setHandled()
		}
		return r
	}

	private onMoveEnd(event: InteractionEvent): InteractionHandlerResult {
		const r = new InteractionHandlerResult()
		const raw = event.raw as PointerEvent
		if (this.capturePointerId === null || raw.pointerId !== this.capturePointerId) {
			return r
		}
		if (this.dragSprite !== null && this.dragImageId !== null && this.startSnapshot !== null) {
			const after = {
				x: this.dragSprite.x,
				y: this.dragSprite.y,
				width: this.dragSprite.width,
				height: this.dragSprite.height,
			}
			const b = this.startSnapshot
			if (after.x !== b.x || after.y !== b.y || after.width !== b.width || after.height !== b.height) {
				this.onCommit(this.dragImageId, b, after)
			}
		}
		try {
			this.canvas.releasePointerCapture(this.capturePointerId)
		} catch {
			// ignore
		}
		this.capturePointerId = null
		this.dragSprite = null
		this.dragImageId = null
		this.startSnapshot = null
		this.mode = null
		this.scaleCorner = null
		this.startRect = null
		return r.setReleaseCapture()
	}
}
