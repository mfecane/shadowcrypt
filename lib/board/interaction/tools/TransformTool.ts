import type { Container } from 'pixi.js'
import { Point, Sprite } from 'pixi.js'
import type { BoardHost } from '~~/lib/board/BoardHost'
import { BoardImageLayout } from '~~/lib/board/BoardImageLayout'
import type { DragOutGhostRect } from '~~/lib/board/BoardImageDragOutController'
import { CanvasEventType } from '~~/lib/board/interaction/CanvasEventType'
import type { DragGesture } from '~~/lib/board/interaction/InteractionContext'
import { IDLE_GESTURE } from '~~/lib/board/interaction/InteractionContext'
import type { InteractionEvent } from '~~/lib/board/interaction/InteractionEvent'
import { InteractionHandlerResult } from '~~/lib/board/interaction/InteractionHandlerResult'
import { HitKind } from '~~/lib/board/interaction/InteractionInfo'
import type { Tool } from '~~/lib/board/interaction/Tool'
import { TransformWidget } from '~~/lib/board/interaction/widgets/TransformWidget'
import { WidgetCorner } from '~~/lib/board/interaction/widgets/WidgetPart'
import { clamp } from '~~/lib/collectionViewer/viewerUtils'

const MIN_SPRITE_SIZE = 16

/** Sprite opacity while its drag has crossed the canvas bounds (replaced by the DOM ghost). */
const DRAG_OUT_SPRITE_ALPHA = 0.2

/** Re-entry requires clearing the exit boundary by this much (px), to avoid edge flicker. */
const DRAG_OUT_REENTRY_MARGIN_PX = 12

function signedSnapshotFromSprite(sprite: Sprite): BoardImageLayout {
	const baseWidth = sprite.texture.orig.width > 0 ? sprite.texture.orig.width : sprite.texture.width
	const baseHeight = sprite.texture.orig.height > 0 ? sprite.texture.orig.height : sprite.texture.height
	const w = Math.abs(sprite.scale.x * baseWidth)
	const h = Math.abs(sprite.scale.y * baseHeight)
	const flipX = sprite.scale.x < 0
	const flipY = sprite.scale.y < 0
	return new BoardImageLayout(
		sprite.zIndex,
		flipX ? sprite.x - w : sprite.x,
		flipY ? sprite.y - h : sprite.y,
		w,
		h,
		flipX,
		flipY
	)
}

function applyUnsignedSizePreserveOrientation(sprite: Sprite, width: number, height: number): void {
	const baseWidth = Math.max(1e-6, sprite.texture.orig.width > 0 ? sprite.texture.orig.width : sprite.texture.width)
	const baseHeight = Math.max(
		1e-6,
		sprite.texture.orig.height > 0 ? sprite.texture.orig.height : sprite.texture.height
	)
	const flipX = sprite.scale.x < 0
	const flipY = sprite.scale.y < 0
	const scaleX = width / baseWidth
	const scaleY = height / baseHeight
	sprite.scale.x = flipX ? -scaleX : scaleX
	sprite.scale.y = flipY ? -scaleY : scaleY
}

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

/** Ghost rect for the gesture's current pointer position; `dragOut` must already be populated. */
function ghostRectFor(
	g: Extract<DragGesture, { kind: 'translate' }>,
	clientX: number,
	clientY: number
): DragOutGhostRect {
	const d = g.dragOut
	if (d === null) {
		throw new Error('ghostRectFor called before the gesture crossed out of the canvas')
	}
	return {
		imageId: g.imageId,
		thumbnailUrl: d.thumbnailUrl,
		width: d.width,
		height: d.height,
		x: clientX - d.grabOffsetX,
		y: clientY - d.grabOffsetY,
	}
}

export class TransformTool implements Tool {
	public readonly id = 'transform'

	public readonly priority = 55

	public enabled = true

	public constructor(
		private readonly worldContainer: Container,
		private readonly canvas: HTMLCanvasElement,
		private readonly board: BoardHost,
		private readonly getWidget: () => TransformWidget | null,
		private readonly globalToClient: (globalX: number, globalY: number) => { x: number; y: number }
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
				return await this.onMoveEnd(event)
			default:
				return new InteractionHandlerResult()
		}
	}

	private onMoveStart(event: InteractionEvent): InteractionHandlerResult {
		const r = new InteractionHandlerResult()
		const h = event.info.hitResult
		if (
			h.kind !== HitKind.widget ||
			h.widgetPart === undefined ||
			h.sprite === undefined ||
			h.imageId === undefined
		) {
			return r
		}
		this.board.touchImage(h.imageId)
		const startSnapshot = signedSnapshotFromSprite(h.sprite)
		const raw = event.raw as PointerEvent

		if (h.widgetPart === 'body') {
			event.context.gesture = {
				kind: 'translate',
				sprite: h.sprite,
				imageId: h.imageId,
				pointerId: raw.pointerId,
				startSnapshot,
				location: 'in-canvas',
				dragOut: null,
			}
		} else {
			const sp = h.sprite
			const vr = TransformWidget.getVisualRect(sp)
			const tl = this.worldContainer.toLocal(sp.toGlobal(new Point(vr.x, vr.y)))
			const br = this.worldContainer.toLocal(sp.toGlobal(new Point(vr.x + vr.w, vr.y + vr.h)))
			event.context.gesture = {
				kind: 'scale',
				sprite: h.sprite,
				imageId: h.imageId,
				pointerId: raw.pointerId,
				startSnapshot,
				corner: h.widgetPart,
				startRect: {
					x: Math.min(tl.x, br.x),
					y: Math.min(tl.y, br.y),
					w: Math.abs(br.x - tl.x),
					h: Math.abs(br.y - tl.y),
				},
			}
		}
		this.canvas.setPointerCapture(raw.pointerId)
		return r.setCapture()
	}

	private onMove(event: InteractionEvent): InteractionHandlerResult {
		const r = new InteractionHandlerResult()
		const g = event.context.gesture
		const raw = event.raw as PointerEvent
		if (g.kind === 'idle' || raw.pointerId !== g.pointerId) {
			return r
		}

		if (g.kind === 'translate') {
			const ld = globalDeltaToParentLocal(this.worldContainer, event.dx, event.dy)
			g.sprite.x += ld.x
			g.sprite.y += ld.y
			this.getWidget()?.syncFromParentSprite()
			event.context.gesture = this.crossCanvasBoundary(g, event)
			return r.setHandled()
		}

		const global = new Point(event.x, event.y)
		const p = this.worldContainer.toLocal(global)
		const s = g.startRect
		const min = MIN_SPRITE_SIZE
		const ratio = s.h !== 0 ? s.w / s.h : 1
		switch (g.corner) {
			case WidgetCorner.nw: {
				const ax = s.x + s.w
				const ay = s.y + s.h
				const dx = ax - p.x
				const dy = ay - p.y
				const w = clamp(Math.min(dx, dy * ratio), min, 1e6)
				const h = clamp(w / ratio, min, 1e6)
				g.sprite.x = ax - w
				g.sprite.y = ay - h
				applyUnsignedSizePreserveOrientation(g.sprite, w, h)
				break
			}
			case WidgetCorner.ne: {
				const bottomY = s.y + s.h
				const dx = p.x - s.x
				const dy = bottomY - p.y
				const w = clamp(Math.min(dx, dy * ratio), min, 1e6)
				const h = clamp(w / ratio, min, 1e6)
				g.sprite.x = s.x
				g.sprite.y = bottomY - h
				applyUnsignedSizePreserveOrientation(g.sprite, w, h)
				break
			}
			case WidgetCorner.se: {
				const dx = p.x - s.x
				const dy = p.y - s.y
				const w = clamp(Math.min(dx, dy * ratio), min, 1e6)
				const h = clamp(w / ratio, min, 1e6)
				g.sprite.x = s.x
				g.sprite.y = s.y
				applyUnsignedSizePreserveOrientation(g.sprite, w, h)
				break
			}
			case WidgetCorner.sw: {
				const rightX = s.x + s.w
				const dx = rightX - p.x
				const dy = p.y - s.y
				const w = clamp(Math.min(dx, dy * ratio), min, 1e6)
				const h = clamp(w / ratio, min, 1e6)
				g.sprite.x = rightX - w
				g.sprite.y = s.y
				applyUnsignedSizePreserveOrientation(g.sprite, w, h)
				break
			}
			default:
				break
		}
		this.getWidget()?.syncFromParentSprite()
		return r.setHandled()
	}

	private async onMoveEnd(event: InteractionEvent): Promise<InteractionHandlerResult> {
		const r = new InteractionHandlerResult()
		const g = event.context.gesture
		const raw = event.raw as PointerEvent
		if (g.kind === 'idle' || raw.pointerId !== g.pointerId) {
			return r
		}

		if (g.kind === 'translate' && g.location === 'out-of-canvas' && g.dragOut !== null) {
			const ghost = ghostRectFor(g, raw.clientX, raw.clientY)
			const moved = await this.board.endImageDragOut(ghost, event.info.dropTargetBoardId)
			if (moved) {
				// Image (and its sprite) now belongs to another board; nothing left here to commit or restore.
				this.endGesture(event, g.pointerId)
				return r.setReleaseCapture()
			}
			g.sprite.alpha = 1
		}

		const after = signedSnapshotFromSprite(g.sprite)
		const before = g.startSnapshot
		if (after.x !== before.x || after.y !== before.y || after.w !== before.w || after.h !== before.h) {
			this.board.commitTransform(g.imageId, before, after)
		}
		this.endGesture(event, g.pointerId)
		return r.setReleaseCapture()
	}

	private endGesture(event: InteractionEvent, pointerId: number): void {
		try {
			this.canvas.releasePointerCapture(pointerId)
		} catch {
			// ignore if already released
		}
		event.context.gesture = IDLE_GESTURE
	}

	/**
	 * Crosses the current translate gesture in/out of the canvas's DOM rect, driving the drag-out
	 * UI. The raw geometric facts (how far past the canvas edge the pointer is, and which DOM drop
	 * target it's over) live on {@link InteractionEvent.info}; this only applies gesture-specific
	 * thresholds (e.g. re-entry hysteresis) on top of them.
	 *
	 * The boards panel overlays the canvas rather than shrinking it, so leaving the canvas's own
	 * DOM rect (`inset < 0`) is not the only way to reach a drop target — hovering one directly
	 * (`dropTargetBoardId !== null`) must trigger drag-out mode too, even while still geometrically
	 * "inside" the canvas.
	 */
	private crossCanvasBoundary(
		g: Extract<DragGesture, { kind: 'translate' }>,
		event: InteractionEvent
	): Extract<DragGesture, { kind: 'translate' }> {
		const raw = event.raw as PointerEvent
		const inset = event.info.pointerInsetFromCanvasPx
		const dropTargetBoardId = event.info.dropTargetBoardId

		if (g.location === 'in-canvas' && (inset < 0 || dropTargetBoardId !== null)) {
			const thumbnailUrl = this.board.getImageThumbnailUrl(g.imageId)
			if (thumbnailUrl === undefined) {
				return g
			}
			const bounds = g.sprite.getBounds()
			const topLeft = this.globalToClient(bounds.minX, bounds.minY)
			const bottomRight = this.globalToClient(bounds.maxX, bounds.maxY)
			g.sprite.alpha = DRAG_OUT_SPRITE_ALPHA
			const next: Extract<DragGesture, { kind: 'translate' }> = {
				...g,
				location: 'out-of-canvas',
				dragOut: {
					thumbnailUrl,
					width: bottomRight.x - topLeft.x,
					height: bottomRight.y - topLeft.y,
					grabOffsetX: raw.clientX - topLeft.x,
					grabOffsetY: raw.clientY - topLeft.y,
				},
			}
			this.board.updateImageDragOut(ghostRectFor(next, raw.clientX, raw.clientY), dropTargetBoardId)
			return next
		}

		if (g.location === 'out-of-canvas' && inset > DRAG_OUT_REENTRY_MARGIN_PX && dropTargetBoardId === null) {
			this.board.cancelImageDragOut()
			g.sprite.alpha = 1
			return { ...g, location: 'in-canvas', dragOut: null }
		}

		if (g.location === 'out-of-canvas' && g.dragOut !== null) {
			this.board.updateImageDragOut(ghostRectFor(g, raw.clientX, raw.clientY), dropTargetBoardId)
		}
		return g
	}
}
