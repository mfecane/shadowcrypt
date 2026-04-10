import type { Container, Renderer } from 'pixi.js'
import { Point } from 'pixi.js'
import type { Board } from '~~/lib/board/Board'
import { CanvasEventType } from '~~/lib/board/interaction/CanvasEventType'
import type { InteractionEvent } from '~~/lib/board/interaction/InteractionEvent'
import { InteractionHandlerResult } from '~~/lib/board/interaction/InteractionHandlerResult'
import { HitKind } from '~~/lib/board/interaction/PixiInteractionContext'
import type { Tool } from '~~/lib/board/interaction/Tool'
import { clamp } from '~~/lib/collectionViewer/viewerUtils'

const TOP_GUTTER = 8

const ZOOM_MIN = 0.25
const ZOOM_MAX = 4

/** Ignore tiny wheel deltas (trackpad momentum tail) so pan does not coast. */
const WHEEL_PAN_TAIL_EPS = 0.5

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
		private readonly board: Board
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

	public getViewportStateForSave(): { centerX: number; centerY: number; zoom: number } {
		return {
			centerX: this.centerWorld.x,
			centerY: this.centerWorld.y,
			zoom: this.zoom,
		}
	}

	public fitWorldToView(): void {
		const { w: vw, h: vh } = this.board.getViewportSize()
		const { minX, minY, w: ww, h: wh } = this.board.getWorldBounds()
		let s = 1
		if (ww !== 0) {
			s = Math.min(vw / ww, vh / (wh + TOP_GUTTER))
		}
		if (s > 1) {
			s = 1
		}
		this.worldContainer.scale.set(s)
		this.worldContainer.rotation = 0
		this.worldContainer.position.x = vw / 2 - (minX + ww / 2) * s
		this.worldContainer.position.y = (vh + TOP_GUTTER) / 2 - (minY + wh / 2) * s
		this.zoom = s
		this.syncStateFromWorld()
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
		const k = e.context.hitResult.kind
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

	private onWheel(event: InteractionEvent): InteractionHandlerResult {
		const r = new InteractionHandlerResult()
		const wheel = event.raw as WheelEvent

		const modifierZoom = wheel.ctrlKey || wheel.metaKey
		const mouseWheelZoom = !modifierZoom && wheel.deltaX === 0 && wheel.deltaMode === WheelEvent.DOM_DELTA_LINE

		if (modifierZoom || mouseWheelZoom) {
			this.zoom += 1 - 2 ** (wheel.deltaY * 0.005)
			this.zoom = clamp(this.zoom, ZOOM_MIN, ZOOM_MAX)
			const focal = this.wheelFocalInRenderSpace(wheel)
			this.applyScaleAtRendererPoint(this.zoom, focal.x, focal.y)
			this.syncStateFromWorld()
			this.board.syncTransformWidgetFromParentSprite()
			this.board.autosave.schedule()
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
		this.board.autosave.schedule()
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
		this.board.autosave.schedule()
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
		this.board.autosave.schedule()
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
