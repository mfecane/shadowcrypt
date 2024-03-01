import { Tween, update as updateTween } from '@tweenjs/tween.js'
import { Vector2, clamp } from '../utils/utils'
import { TouchInteractionState } from './PinchNav'

export interface NavigatorState {
	onPointerDown(event: PointerEvent): void
	onPointerMove(event: PointerEvent): void
	onPointerUp(event: PointerEvent): void
	onWheel(event: WheelEvent): void
	enterState(): void
	exitState(): void
	setScale(value: number): void
}

class MouseInteractionState implements NavigatorState {
	private static readonly MIDDLE_MOUSE_BUTTON = 1

	private isDragging: boolean = false

	private startDrag: Vector2 = { x: 0, y: 0 }

	private virtualScale: number = 1

	private tweenTarget = { scale: 1 }

	private tween: Tween<{ scale: number }> = new Tween(this.tweenTarget)

	private animationId: number = -1

	public constructor(private readonly navigator: Navigator) {}

	public enterState() {
		this.animate()
	}

	public exitState() {
		this.tween.stop()
		cancelAnimationFrame(this.animationId)
	}

	public onPointerDown(event: PointerEvent): void {
		if (this.isMiddleMouseOrPointer(event)) {
			this.isDragging = true
			this.startDrag = { x: event.clientX, y: event.clientY }
			this.navigator.container.setPointerCapture(event.pointerId)
		}
	}

	public onPointerMove(event: PointerEvent): void {
		if (this.isDragging) {
			this.navigator.position.x += event.clientX - this.startDrag.x
			this.navigator.position.y += event.clientY - this.startDrag.y
			this.startDrag = { x: event.clientX, y: event.clientY }
		}
	}

	public onPointerUp(event: PointerEvent): void {
		if (this.isDragging) {
			this.isDragging = false
			this.navigator.container.releasePointerCapture(event.pointerId)
		}
	}

	public onWheel(e: WheelEvent) {
		this.virtualScale += 1 - 2 ** (e.deltaY * 0.005)
		this.virtualScale = clamp(this.virtualScale, 0.25, 4.0)
		this.setScaleToPointWithTransition(e)
	}

	private setScaleToPointWithTransition(e: WheelEvent) {
		this.tween.stop()
		this.tween = new Tween<{ scale: number }>(this.tweenTarget)
			.to({ scale: this.virtualScale }, 200)
			.onUpdate(() => this.setScaleToPoint(this.tweenTarget.scale, e))
			.start()
	}

	public setScale(scale: number) {
		this.tweenTarget.scale = scale
		this.virtualScale = scale
	}

	private animate() {
		this.animationId = requestAnimationFrame(() => {
			updateTween()
			this.animate()
		})
	}

	private isMiddleMouseOrPointer(event: PointerEvent): boolean {
		return event.pointerType === 'mouse' && event.button === MouseInteractionState.MIDDLE_MOUSE_BUTTON
	}

	private setScaleToPoint(scale: number, e: WheelEvent) {
		const mousePos = this.clientPosToTranslatedPos({ x: e.clientX, y: e.clientY })
		this.scaleFromPoint(scale, mousePos)
	}

	private clientPosToTranslatedPos({ x, y }: Vector2) {
		return {
			x: x - this.navigator.position.x,
			y: y - this.navigator.position.y,
		}
	}

	private scaleFromPoint(newScale: number, focalPt: Vector2) {
		const scaleRatio = newScale / (this.navigator.scale != 0 ? this.navigator.scale : 1)
		const focalPtDelta = {
			x: this.coordChange(focalPt.x, scaleRatio),
			y: this.coordChange(focalPt.y, scaleRatio),
		}
		this.navigator.position = {
			x: this.navigator.position.x - focalPtDelta.x,
			y: this.navigator.position.y - focalPtDelta.y,
		}
		this.navigator.scale = newScale
	}

	private coordChange(coordinate: number, scaleRatio: number) {
		return scaleRatio * coordinate - coordinate
	}
}

export class Navigator {
	private static readonly MIDDLE_MOUSE_BUTTON = 1
	private static readonly TOP_GUTTER = 60
	private static readonly STEP = 100

	public position: Vector2 = { x: 0, y: 0 }

	public scale: number = 1

	private defaultWidth: number

	private defaultHeight: number

	private state: NavigatorState | null = null

	private animationId: number = -1

	public constructor(public readonly container: HTMLDivElement, private readonly element: HTMLDivElement) {
		if (!this.container) {
			debugger
		}

		this.container.addEventListener('pointerdown', (event) => this.onPointerDown(event))
		this.container.addEventListener('pointermove', (event) => this.onPointerMove(event))
		this.container.addEventListener('pointerup', (event) => this.onPointerUp(event))

		this.container.addEventListener('wheel', (event) => this.onWheel(event))

		this.container.addEventListener('touchstart', (event) => this.onTouchStart(event))
		this.container.addEventListener('touchmove', (event) => this.onTouchMove(event))
		this.container.addEventListener('touchend', (event) => this.onTouchEnd(event))

		window.addEventListener('keydown', (event) => this.onKeyPress(event))

		const box = this.element.getBoundingClientRect()
		this.defaultWidth = box.width
		this.defaultHeight = box.height

		this.switchState(new MouseInteractionState(this))

		this.animate()
	}

	public destroy() {
		cancelAnimationFrame(this.animationId)
		this.state?.exitState()
	}

	public scaleToFit() {
		const { width: containerWidth, height: containerHeight } = this.container.getBoundingClientRect()

		let newScale: number
		if (this.defaultWidth !== 0) {
			newScale = Math.min(
				containerWidth / this.defaultWidth,
				containerHeight / (this.defaultHeight + Navigator.TOP_GUTTER)
			)
		} else {
			newScale = 1
		}
		newScale = newScale > 1 ? 1 : newScale

		const newWidth = this.defaultWidth * newScale
		const newHeight = this.defaultHeight * newScale

		this.position = {
			x: (containerWidth - newWidth) / 2,
			y: (containerHeight - newHeight) / 2 + Navigator.TOP_GUTTER,
		}

		this.setScale(newScale)
	}

	public switchState(state: NavigatorState) {
		this.state?.exitState()
		this.state = state
		this.state.enterState()
	}

	public detectInteractionState(event: PointerEvent): void {
		if (this.isTouch(event)) {
			if (this.state instanceof TouchInteractionState) {
				return
			}
			this.switchState(new TouchInteractionState(this))
		} else {
			if (this.state instanceof MouseInteractionState) {
				return
			}
			this.switchState(new MouseInteractionState(this))
		}
	}

	private isTouch(event: PointerEvent): boolean {
		return event.pointerType === 'touch'
	}

	private setScale(scale: number) {
		this.scale = scale
		this.state?.setScale(scale)
	}

	private onPointerDown(event: PointerEvent): void {
		// event.preventDefault()

		this.detectInteractionState(event)
		this.state?.onPointerDown(event)
	}

	private onPointerMove(event: PointerEvent): void {
		event.preventDefault()

		this.state?.onPointerMove(event)
	}

	private onPointerUp(event: PointerEvent): void {
		event.preventDefault()

		this.state?.onPointerUp(event)
	}

	private onTouchStart(event: TouchEvent) {
		event.preventDefault()
	}

	private onTouchMove(event: TouchEvent) {
		event.preventDefault()
	}

	private onTouchEnd(event: TouchEvent) {
		event.preventDefault()
	}

	private onWheel(e: WheelEvent) {
		this.state?.onWheel(e)
	}

	private onKeyPress(event: KeyboardEvent) {
		const code = event.code
		switch (code) {
			case 'ArrowUp':
			case 'KeyW':
				this.position.y += Navigator.STEP
				break
			case 'ArrowDown':
			case 'KeyS':
				this.position.y -= Navigator.STEP
				break
			case 'ArrowLeft':
			case 'KeyA':
				this.position.x += Navigator.STEP
				break
			case 'ArrowRight':
			case 'KeyD':
				this.position.x -= Navigator.STEP
				break
		}
	}

	private animate() {
		this.animationId = requestAnimationFrame(() => {
			this.update()
			this.animate()
		})
	}

	public update() {
		this.element.style.transform = `translate(${this.position.x}px, ${this.position.y}px) scale(${this.scale})`
	}
}
