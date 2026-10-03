import type { Container, Renderer } from 'pixi.js'
import { Point } from 'pixi.js'
import type { BoardHost } from '~~/lib/board/BoardHost'
import type { BoardViewportState } from '~~/lib/board/BoardViewport'
import { computeFitViewportSnapshot } from '~~/lib/board/layoutGeometry'
import { CanvasEventType } from '~~/lib/board/interaction/CanvasEventType'
import type { InteractionEvent } from '~~/lib/board/interaction/InteractionEvent'
import { InteractionHandlerResult } from '~~/lib/board/interaction/InteractionHandlerResult'
import { HitKind } from '~~/lib/board/interaction/InteractionInfo'
import { clientToGlobalCoords } from '~~/lib/board/interaction/screenCoords'
import type { Tool } from '~~/lib/board/interaction/Tool'
import { clamp } from '~~/lib/collectionViewer/viewerUtils'

const ZOOM_MIN = 0.25
const ZOOM_MAX = 4

/** Ignore tiny wheel deltas (trackpad momentum tail) so pan does not coast. */
const WHEEL_PAN_TAIL_EPS = 0.5

const WHEEL_LINE_HEIGHT_PX = 33

/** Log2 zoom change per wheel pixel: ~100px notch → ~19% step. */
const WHEEL_ZOOM_RATE_MOUSE = 0.003

/** Log2 zoom change per pinch pixel (ctrl+wheel emits small deltas at high frequency). */
const WHEEL_ZOOM_RATE_TRACKPAD = 0.02

/** Caps ctrl+mouse-wheel notches (~100px) so they don't jump several zoom levels at once. */
const PINCH_MAX_PIXELS_PER_EVENT = 10

/** Pan/zoom state: world-space point shown at the viewport center, plus uniform scale. */
export class NavigationTool implements Tool {
	private static readonly ENABLE_PINCH_ROTATION = false

	public readonly id = 'navigation'

	public readonly priority = 10

	public enabled = true

	private readonly centerWorld = new Point(0, 0)

	private zoom = 1

	private capturePointerId: number | null = null

	private panActive = false

	public constructor(
		private readonly worldContainer: Container,
		private readonly canvas: HTMLCanvasElement,
		private readonly renderer: Renderer,
		private readonly board: BoardHost
	) {}

	public destroy(): void {}

	/** Applies {@link centerWorld} and {@link zoom} to the world container (rotation cleared). */
	public applyViewport(): void {
		const { w: vw, h: vh } = this.board.getViewportSize()
		const vx = vw / 2
		const vy = vh / 2
		const z = this.zoom
		this.worldContainer.rotation = 0
		this.worldContainer.scale.set(z)
		this.worldContainer.position.x = vx - this.centerWorld.x * z
		this.worldContainer.position.y = vy - this.centerWorld.y * z
		this.board.syncTransformWidgetFromParentSprite()
	}

	/** Restores saved viewport; clamps zoom to [{@link ZOOM_MIN}, {@link ZOOM_MAX}]. */
	public setViewportFromSaved(center: { x: number; y: number }, zoom: number): void {
		this.centerWorld.x = center.x
		this.centerWorld.y = center.y
		this.zoom = clamp(zoom, ZOOM_MIN, ZOOM_MAX)
		this.applyViewport()
	}

	public clientToWorld(clientX: number, clientY: number): Point {
		const global = clientToGlobalCoords(this.canvas, this.renderer, clientX, clientY)
		return this.worldContainer.toLocal(new Point(global.x, global.y))
	}

	public getViewportStateForSave(): BoardViewportState {
		return {
			centerX: this.centerWorld.x,
			centerY: this.centerWorld.y,
			zoom: this.zoom,
		}
	}

	/** Fits camera to current world bounds (no layout change). Used after e.g. image removal. */
	public fitWorldToView(): void {
		const { w: vw, h: vh } = this.board.getViewportSize()
		const { minX, minY, w: ww, h: wh } = this.board.getWorldBounds()
		const snap = computeFitViewportSnapshot(vw, vh, {
			minX,
			minY,
			width: ww,
			height: wh,
		})
		this.setViewportFromSaved({ x: snap.centerX, y: snap.centerY }, snap.zoom)
		this.board.syncTransformWidgetFromParentSprite()
	}

	private syncStateFromWorld(): void {
		const { w: vw, h: vh } = this.board.getViewportSize()
		const screenCenter = new Point(vw / 2, vh / 2)
		const local = this.worldContainer.toLocal(screenCenter)
		this.centerWorld.copyFrom(local)
		this.zoom = this.worldContainer.scale.x
	}

	public isEnabled(event: InteractionEvent): boolean {
		if (!this.enabled) {
			return false
		}
		switch (event.type) {
			case CanvasEventType.Wheel:
			case CanvasEventType.MoveStart:
			case CanvasEventType.Move:
			case CanvasEventType.MoveEnd:
			case CanvasEventType.PinchMove:
				return true
			default:
				return false
		}
	}

	public async onEvent(event: InteractionEvent): Promise<InteractionHandlerResult> {
		switch (event.type) {
			case CanvasEventType.Wheel:
				return this.onWheel(event)
			case CanvasEventType.PinchMove:
				return this.onPinchMove(event)
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

	private shouldPan(e: InteractionEvent): boolean {
		const raw = e.raw as PointerEvent
		const k = e.info.hitResult.kind
		if (raw.pointerType === 'mouse') {
			if ((raw.buttons & 4) !== 0) {
				return true
			}
			if (((raw.buttons & 1) !== 0 && k === HitKind.none) || k === HitKind.sprite) {
				return true
			}
			return false
		}
		if (raw.pointerType === 'touch') {
			return k === HitKind.none || k === HitKind.sprite
		}
		return false
	}

	/** Cursor position in renderer / global space (matches Pixi toLocal/toGlobal). */
	private wheelFocalInRenderSpace(w: WheelEvent): Point {
		const rect = this.canvas.getBoundingClientRect()
		const sw = this.renderer.screen.width
		const sh = this.renderer.screen.height
		const x = (w.clientX - rect.left) * (sw / rect.width)
		const y = (w.clientY - rect.top) * (sh / rect.height)
		return new Point(x, y)
	}

	/**
	 * macOS often reports a mouse wheel as {@link WheelEvent.DOM_DELTA_LINE}; Windows/Linux Chromium
	 * usually use {@link WheelEvent.DOM_DELTA_PIXEL} with legacy ±120 `wheelDelta` steps. Trackpads
	 * also use pixel mode but rarely expose 120-divisible legacy deltas or emit smaller deltas.
	 */
	private isVerticalMouseWheelZoom(wheel: WheelEvent): boolean {
		if (wheel.deltaX !== 0) {
			return false
		}
		if (wheel.deltaMode === WheelEvent.DOM_DELTA_LINE) {
			return true
		}
		if (wheel.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
			return false
		}
		const w = wheel as WheelEvent & { wheelDelta?: number; wheelDeltaY?: number }
		const legacy = w.wheelDeltaY ?? w.wheelDelta
		if (legacy !== undefined && legacy !== 0 && Math.abs(legacy) % 120 === 0) {
			return true
		}
		// Chromium on Windows often omits line mode; fall back on typical notched pixel deltas only.
		if (typeof navigator !== 'undefined' && /Windows/i.test(navigator.userAgent)) {
			return wheel.deltaMode === WheelEvent.DOM_DELTA_PIXEL && Math.abs(wheel.deltaY) >= 24
		}
		return false
	}

	private wheelDeltaYInPixels(wheel: WheelEvent): number {
		switch (wheel.deltaMode) {
			case WheelEvent.DOM_DELTA_LINE:
				return wheel.deltaY * WHEEL_LINE_HEIGHT_PX
			case WheelEvent.DOM_DELTA_PAGE:
				return wheel.deltaY * this.board.getViewportSize().h
			default:
				return wheel.deltaY
		}
	}

	private onWheel(event: InteractionEvent): InteractionHandlerResult {
		const r = new InteractionHandlerResult()
		const wheel = event.raw as WheelEvent

		const modifierZoom = wheel.ctrlKey || wheel.metaKey
		const mouseWheelZoom = !modifierZoom && this.isVerticalMouseWheelZoom(wheel)

		if (modifierZoom || mouseWheelZoom) {
			const pixels = this.wheelDeltaYInPixels(wheel)
			// Mac pinch arrives as ctrl+wheel, often with 120-divisible legacy deltas, so it cannot be told apart from a mouse wheel.
			const log2Step = modifierZoom
				? clamp(pixels, -PINCH_MAX_PIXELS_PER_EVENT, PINCH_MAX_PIXELS_PER_EVENT) * WHEEL_ZOOM_RATE_TRACKPAD
				: pixels * WHEEL_ZOOM_RATE_MOUSE
			this.zoom *= 2 ** -log2Step
			this.zoom = clamp(this.zoom, ZOOM_MIN, ZOOM_MAX)
			const focal = this.wheelFocalInRenderSpace(wheel)
			this.applyScaleAtRendererPoint(this.zoom, focal.x, focal.y)
			this.syncStateFromWorld()
			this.board.syncTransformWidgetFromParentSprite()
			this.board.autosave.scheduleViewport()
			r.setHandled()
			return r
		}

		const dx = wheel.deltaX
		const dy = wheel.deltaY
		if (Math.abs(dx) < WHEEL_PAN_TAIL_EPS && Math.abs(dy) < WHEEL_PAN_TAIL_EPS) {
			return r.setHandled()
		}

		this.worldContainer.position.x -= dx
		this.worldContainer.position.y -= dy
		this.syncStateFromWorld()
		this.board.syncTransformWidgetFromParentSprite()
		this.board.autosave.scheduleViewport()
		r.setHandled()
		return r
	}

	private onPinchMove(event: InteractionEvent): InteractionHandlerResult {
		const r = new InteractionHandlerResult()
		const pinchDelta = event.pinchDistSqDelta
		const rotDelta = event.rotationDelta
		this.worldContainer.position.x += event.dx
		this.worldContainer.position.y += event.dy
		if (pinchDelta !== undefined) {
			this.zoom += 1 - 2 ** (pinchDelta * 0.00001)
			this.zoom = clamp(this.zoom, ZOOM_MIN, ZOOM_MAX)
			this.applyScaleAtRendererPoint(this.zoom, event.x, event.y)
		}
		if (NavigationTool.ENABLE_PINCH_ROTATION && rotDelta !== undefined && rotDelta !== 0) {
			this.applyRotationAtRendererPoint(rotDelta, event.x, event.y)
		}
		this.syncStateFromWorld()
		this.board.syncTransformWidgetFromParentSprite()
		this.board.autosave.scheduleViewport()
		r.setHandled()
		return r
	}

	private onMoveStart(event: InteractionEvent): InteractionHandlerResult {
		const r = new InteractionHandlerResult()
		if (!this.shouldPan(event)) {
			return r
		}
		const raw = event.raw as PointerEvent
		this.capturePointerId = raw.pointerId
		this.panActive = true
		this.canvas.setPointerCapture(raw.pointerId)
		r.setCapture()
		return r
	}

	private onMove(event: InteractionEvent): InteractionHandlerResult {
		const r = new InteractionHandlerResult()
		if (!this.panActive) {
			return r
		}
		this.worldContainer.position.x += event.dx
		this.worldContainer.position.y += event.dy
		this.syncStateFromWorld()
		this.board.syncTransformWidgetFromParentSprite()
		r.setHandled()
		return r
	}

	private onMoveEnd(event: InteractionEvent): InteractionHandlerResult {
		const r = new InteractionHandlerResult()
		const raw = event.raw as PointerEvent
		if (this.capturePointerId === null || raw.pointerId !== this.capturePointerId) {
			return r
		}
		this.panActive = false
		try {
			this.canvas.releasePointerCapture(this.capturePointerId)
		} catch {
			// ignore if already released
		}
		this.capturePointerId = null
		this.board.autosave.scheduleViewport()
		r.setReleaseCapture()
		return r
	}

	private applyScaleAtRendererPoint(newScale: number, globalX: number, globalY: number): void {
		const focalGlobal = new Point(globalX, globalY)
		const before = this.worldContainer.toLocal(focalGlobal)
		this.worldContainer.scale.set(newScale)
		const after = this.worldContainer.toGlobal(before)
		this.worldContainer.position.x += focalGlobal.x - after.x
		this.worldContainer.position.y += focalGlobal.y - after.y
		this.zoom = newScale
	}

	private applyRotationAtRendererPoint(delta: number, globalX: number, globalY: number): void {
		const focalGlobal = new Point(globalX, globalY)
		const before = this.worldContainer.toLocal(focalGlobal)
		this.worldContainer.rotation += delta
		const after = this.worldContainer.toGlobal(before)
		this.worldContainer.position.x += focalGlobal.x - after.x
		this.worldContainer.position.y += focalGlobal.y - after.y
	}
}
