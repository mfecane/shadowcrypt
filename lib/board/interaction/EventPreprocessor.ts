import type { Renderer } from 'pixi.js'
import { CanvasEventType } from '~~/lib/board/interaction/CanvasEventType'
import { InteractionEvent } from '~~/lib/board/interaction/InteractionEvent'
import type { PixiInteractionContext } from '~~/lib/board/interaction/PixiInteractionContext'
import { Vector2 } from '~~/lib/math/Vector2'
import { normalizeAngleDelta } from '~~/lib/math/utils'

interface PinchData {
	distSq: number
	angle: number
	cx: number
	cy: number
}

export class EventPreprocessor {
	/**
	 * The minimum distance in pixels between two pointer events to be considered a double click.
	 */
	private static readonly DOUBLE_CLICK_SHIFT = 10

	private static readonly SINGLE_CLICK_DELAY_MS = 125

	private static readonly DOUBLE_CLICK_TIME_MS = 250

	private static modifiersFrom(e: PointerEvent | WheelEvent) {
		return {
			shift: e.shiftKey,
			ctrl: e.ctrlKey,
			meta: e.metaKey,
			alt: e.altKey,
		}
	}

	private readonly pointerCache = new Map<number, PointerEvent>()

	private gestureActive = false

	private prevPinch: PinchData | null = null

	private lastPointerDownPosition: { x: number; y: number } | null = null

	private lastPointerUpPosition: { x: number; y: number } | null = null

	private lastPointerUpTime: number = 0

	private singleClickTimeoutId: ReturnType<typeof setTimeout> | null = null

	private isDragging = false

	private dragPointerId: number | null = null

	private lastMoveClient: { x: number; y: number } | null = null

	private suppressClickUntilPointerDown = false

	public constructor(
		private readonly canvas: HTMLCanvasElement,
		private readonly renderer: Renderer,
		private readonly context: PixiInteractionContext,
		private readonly emit: (event: InteractionEvent) => void | Promise<void>
	) {}

	/** Maps client coordinates to Pixi global space (matches `renderer.screen` and `getBounds()`). */
	private clientToGlobalCoords(clientX: number, clientY: number): Vector2 {
		const rect = this.canvas.getBoundingClientRect()
		const sw = this.renderer.screen.width
		const sh = this.renderer.screen.height
		return Vector2.from((clientX - rect.left) * (sw / rect.width), (clientY - rect.top) * (sh / rect.height))
	}

	private readonly onPointerDownBound = (e: PointerEvent) => {
		void this.onPointerDown(e)
	}

	private readonly onPointerMoveBound = (e: PointerEvent) => {
		void this.onPointerMove(e)
	}

	private readonly onPointerUpBound = (e: PointerEvent) => {
		void this.onPointerUp(e)
	}

	private readonly onWheelBound = (e: WheelEvent) => {
		void this.onWheel(e)
	}

	private readonly onPointerLeaveBound = () => {
		this.canvas.style.cursor = ''
	}

	public attach(): void {
		this.canvas.addEventListener('pointerdown', this.onPointerDownBound)
		this.canvas.addEventListener('pointermove', this.onPointerMoveBound)
		this.canvas.addEventListener('pointerup', this.onPointerUpBound)
		this.canvas.addEventListener('pointercancel', this.onPointerUpBound)
		this.canvas.addEventListener('pointerleave', this.onPointerLeaveBound)
		this.canvas.addEventListener('wheel', this.onWheelBound, { passive: false })
	}

	public detach(): void {
		this.canvas.removeEventListener('pointerdown', this.onPointerDownBound)
		this.canvas.removeEventListener('pointermove', this.onPointerMoveBound)
		this.canvas.removeEventListener('pointerup', this.onPointerUpBound)
		this.canvas.removeEventListener('pointercancel', this.onPointerUpBound)
		this.canvas.removeEventListener('pointerleave', this.onPointerLeaveBound)
		this.canvas.removeEventListener('wheel', this.onWheelBound)
	}

	private async dispatch(
		type: CanvasEventType,
		clientX: number,
		clientY: number,
		dx: number,
		dy: number,
		raw: PointerEvent | WheelEvent,
		pinchDistSqDelta?: number,
		rotationDelta?: number
	): Promise<void> {
		const { x, y } = this.clientToGlobalCoords(clientX, clientY)
		this.context.updateHitFromRendererCoords(x, y)
		const ev = new InteractionEvent(
			type,
			x,
			y,
			dx,
			dy,
			EventPreprocessor.modifiersFrom(raw),
			raw,
			this.context,
			pinchDistSqDelta,
			rotationDelta
		)
		await this.emit(ev)
	}

	private getTouchPointers(): PointerEvent[] {
		return [...this.pointerCache.values()].filter((p) => p.pointerType === 'touch')
	}

	private computePinchGesture(): PinchData | null {
		const t = this.getTouchPointers()
		if (t.length < 2) {
			return null
		}
		const a: PointerEvent | undefined = t[0]
		const b: PointerEvent | undefined = t[1]
		if (a === undefined || b === undefined) {
			return null
		}
		const dx = b.clientX - a.clientX
		const dy = b.clientY - a.clientY
		const distSq = dx * dx + dy * dy
		const angle = Math.atan2(dy, dx)
		const cx = (a.clientX + b.clientX) / 2
		const cy = (a.clientY + b.clientY) / 2
		return { distSq, angle, cx, cy }
	}

	private cancelClickTimers(): void {
		if (this.singleClickTimeoutId !== null) {
			clearTimeout(this.singleClickTimeoutId)
			this.singleClickTimeoutId = null
		}
	}

	private async onPointerDown(event: PointerEvent): Promise<void> {
		this.pointerCache.set(event.pointerId, event)

		const touchPointers = this.getTouchPointers()
		const wasGesture = this.gestureActive

		if (touchPointers.length >= 2) {
			if (!wasGesture) {
				if (this.isDragging && this.dragPointerId !== null) {
					const last = this.pointerCache.get(this.dragPointerId)
					const raw = last ?? event
					await this.dispatch(CanvasEventType.MoveEnd, raw.clientX, raw.clientY, 0, 0, raw)
					this.isDragging = false
					this.dragPointerId = null
					this.lastMoveClient = null
				}
				this.cancelClickTimers()
				this.lastPointerDownPosition = null
			}
			this.gestureActive = true
			this.prevPinch = this.computePinchGesture()
			return
		}

		if (this.gestureActive) {
			return
		}

		this.suppressClickUntilPointerDown = false
		this.dragPointerId = event.pointerId
		this.lastPointerDownPosition = Vector2.fromEvent(event)
		this.isDragging = false
		this.lastMoveClient = Vector2.fromEvent(event)
		this.cancelClickTimers()
	}

	private async onPointerMove(event: PointerEvent): Promise<void> {
		event.preventDefault()
		this.pointerCache.set(event.pointerId, event)

		if (this.gestureActive && this.getTouchPointers().length < 2) {
			this.gestureActive = false
			this.prevPinch = null
		}

		if (this.gestureActive && this.getTouchPointers().length >= 2) {
			const now = this.computePinchGesture()
			if (now === null) {
				return
			}
			if (this.prevPinch === null) {
				this.prevPinch = now
				return
			}
			const pinchDistSqDelta = this.prevPinch.distSq - now.distSq
			const rotationDelta = normalizeAngleDelta(this.prevPinch.angle, now.angle)
			const panDx = now.cx - this.prevPinch.cx
			const panDy = now.cy - this.prevPinch.cy
			this.prevPinch = now
			const { x, y } = this.clientToGlobalCoords(now.cx, now.cy)
			this.context.updateHitFromRendererCoords(x, y)
			const ev = new InteractionEvent(
				CanvasEventType.PinchMove,
				x,
				y,
				panDx,
				panDy,
				EventPreprocessor.modifiersFrom(event),
				event,
				this.context,
				pinchDistSqDelta,
				rotationDelta
			)
			await this.emit(ev)
			return
		}

		let dx = 0
		let dy = 0
		if (this.lastMoveClient !== null) {
			dx = event.clientX - this.lastMoveClient.x
			dy = event.clientY - this.lastMoveClient.y
		}
		this.lastMoveClient = { x: event.clientX, y: event.clientY }

		if (!this.gestureActive && !this.isDragging) {
			await this.dispatch(CanvasEventType.Hover, event.clientX, event.clientY, 0, 0, event)
		}

		if (!this.isDragging && this.dragPointerId === event.pointerId && this.isMoved(event.clientX, event.clientY)) {
			this.isDragging = true
			await this.dispatch(CanvasEventType.MoveStart, event.clientX, event.clientY, 0, 0, event)
		}

		if (this.isDragging && this.dragPointerId === event.pointerId) {
			await this.dispatch(CanvasEventType.Move, event.clientX, event.clientY, dx, dy, event)
		}
	}

	private async onPointerUp(event: PointerEvent): Promise<void> {
		event.preventDefault()

		const touchCountBefore = this.getTouchPointers().length

		this.pointerCache.delete(event.pointerId)

		const touchCountAfter = this.getTouchPointers().length

		if (touchCountBefore >= 2 && touchCountAfter < 2) {
			this.suppressClickUntilPointerDown = true
		}

		if (this.getTouchPointers().length < 2) {
			this.gestureActive = false
			this.prevPinch = null
		}

		if (this.gestureActive) {
			return
		}

		if (this.isDragging && this.dragPointerId === event.pointerId) {
			await this.dispatch(CanvasEventType.MoveEnd, event.clientX, event.clientY, 0, 0, event)
			this.isDragging = false
			this.dragPointerId = null
			this.lastMoveClient = null
			this.lastPointerDownPosition = null
			this.lastPointerUpPosition = null
			this.lastPointerUpTime = 0
			return
		}

		if (this.pointerCache.size > 0) {
			return
		}

		this.dragPointerId = null
		this.lastMoveClient = null

		if (this.suppressClickUntilPointerDown) {
			this.suppressClickUntilPointerDown = false
			this.lastPointerUpPosition = null
			this.lastPointerUpTime = 0
			return
		}

		if (this.isMoved(event.clientX, event.clientY)) {
			this.lastPointerUpPosition = null
			this.lastPointerUpTime = 0
			return
		}

		const currentTime = Date.now()
		const currentPosition = Vector2.fromEvent(event)

		const isDoubleClick =
			this.lastPointerUpPosition !== null &&
			this.lastPointerUpTime > 0 &&
			currentTime - this.lastPointerUpTime < EventPreprocessor.DOUBLE_CLICK_TIME_MS &&
			!this.isMoved(event.clientX, event.clientY, this.lastPointerUpPosition)

		if (isDoubleClick) {
			this.cancelClickTimers()
			this.lastPointerUpPosition = null
			this.lastPointerUpTime = 0
			await this.dispatch(CanvasEventType.DoubleClick, event.clientX, event.clientY, 0, 0, event)
			return
		}

		this.lastPointerUpPosition = currentPosition
		this.lastPointerUpTime = currentTime

		if (this.singleClickTimeoutId !== null) {
			clearTimeout(this.singleClickTimeoutId)
		}
		this.singleClickTimeoutId = setTimeout(() => {
			this.singleClickTimeoutId = null
			this.lastPointerUpPosition = null
			this.lastPointerUpTime = 0
			void this.dispatch(CanvasEventType.Click, event.clientX, event.clientY, 0, 0, event)
		}, EventPreprocessor.SINGLE_CLICK_DELAY_MS)
	}

	private isMoved(x: number, y: number, referencePosition?: Vector2): boolean {
		const position = referencePosition ?? this.lastPointerDownPosition
		if (position === null) {
			return false
		}
		const dx = x - position.x
		const dy = y - position.y
		return Math.hypot(dx, dy) > EventPreprocessor.DOUBLE_CLICK_SHIFT
	}

	private async onWheel(event: WheelEvent): Promise<void> {
		event.preventDefault()
		await this.dispatch(CanvasEventType.Wheel, event.clientX, event.clientY, event.deltaX, event.deltaY, event)
		await this.dispatch(CanvasEventType.Hover, event.clientX, event.clientY, 0, 0, event)
	}
}
