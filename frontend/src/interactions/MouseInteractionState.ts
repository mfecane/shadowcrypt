import { Vector2, clamp } from '@/utils/utils'
import { Navigator, NavigatorState } from './Navigator'
import { Tween, update as updateTween } from '@tweenjs/tween.js'

export class MouseInteractionState implements NavigatorState {
	private static readonly MIDDLE_MOUSE_BUTTON = 1

	private isDragging: boolean = false

	private startDrag: Vector2 = { x: 0, y: 0 }

	private virtualScale: number = 1

	private tweenTarget = { scale: 1 }

	private tween: Tween<{ scale: number }> = new Tween(this.tweenTarget)

	private animationId: number = -1

	public constructor(private readonly navigator: Navigator) {}

	public enterState(): void {
		this.animate()
	}

	public exitState(): void {
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
			this.navigator.setPosition(
				this.navigator.position.x + event.clientX - this.startDrag.x,
				this.navigator.position.y + event.clientY - this.startDrag.y
			)
			this.startDrag = { x: event.clientX, y: event.clientY }
		}
	}

	public onPointerUp(event: PointerEvent): void {
		if (this.isDragging) {
			this.isDragging = false
			this.navigator.container.releasePointerCapture(event.pointerId)
		}
	}

	public onWheel(e: WheelEvent): void {
		this.virtualScale += 1 - 2 ** (e.deltaY * 0.005)
		this.virtualScale = clamp(this.virtualScale, 0.25, 4.0)
		this.setScaleToPointWithTransition(e)
	}

	private setScaleToPointWithTransition(e: WheelEvent): void {
		this.tween.stop()
		this.tween = new Tween<{ scale: number }>(this.tweenTarget)
			.to({ scale: this.virtualScale }, 200)
			.onUpdate(() => this.setScaleToPoint(this.tweenTarget.scale, e))
			.start()
	}

	public setScale(scale: number): void {
		this.tweenTarget.scale = scale
		this.virtualScale = scale
	}

	private animate(): void {
		this.animationId = requestAnimationFrame(() => {
			updateTween()
			this.animate()
		})
	}

	private isMiddleMouseOrPointer(event: PointerEvent): boolean {
		return event.pointerType === 'mouse' && event.button === MouseInteractionState.MIDDLE_MOUSE_BUTTON
	}

	private setScaleToPoint(scale: number, e: WheelEvent): void {
		const mousePos = this.clientPosToTranslatedPos({ x: e.clientX, y: e.clientY })
		this.scaleFromPoint(scale, mousePos)
	}

	private clientPosToTranslatedPos({ x, y }: Vector2): Vector2 {
		return {
			x: x - this.navigator.position.x,
			y: y - this.navigator.position.y,
		}
	}

	private scaleFromPoint(newScale: number, focalPt: Vector2): void {
		const scaleRatio = newScale / (this.navigator.scale != 0 ? this.navigator.scale : 1)
		const focalPtDelta = {
			x: this.coordChange(focalPt.x, scaleRatio),
			y: this.coordChange(focalPt.y, scaleRatio),
		}
		this.navigator.setPosition(this.navigator.position.x - focalPtDelta.x, this.navigator.position.y - focalPtDelta.y)
		this.navigator.scale = newScale
	}

	private coordChange(coordinate: number, scaleRatio: number): number {
		return scaleRatio * coordinate - coordinate
	}
}
