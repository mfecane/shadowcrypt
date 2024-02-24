import { Tween, update, Easing } from '@tweenjs/tween.js'
import { clamp } from './utils/utils'
import { debounce } from 'lodash'

type Vector2 = { x: number; y: number }

export class Navigator {
	private static readonly MIDDLE_MOUSE_BUTTON = 1

	private position: Vector2 = { x: 0, y: 0 }

	private scale: number = 1

	private virtualScale: number = 1

	private isDragging: boolean = false

	private startDrag: Vector2 = { x: 0, y: 0 }

	private tweenTarget = { scale: 1 }

	private setNewScale: (e: WheelEvent) => void

	private tween: Tween<{ scale: number }>

	private animationId: number = -1

	public constructor(private readonly triggerElement: HTMLDivElement, private readonly element: HTMLDivElement) {
		this.triggerElement.addEventListener('pointerdown', (event) => this.onPointerDown(event))
		this.triggerElement.addEventListener('pointermove', (event) => this.onPointerMove(event))
		this.triggerElement.addEventListener('pointerup', (event) => this.onPonterUp(event))
		this.triggerElement.addEventListener('wheel', (event) => this.onWheel(event))

		const self = this
		this.tween = new Tween(this.tweenTarget)
		this.setNewScale = debounce(function (e: WheelEvent) {
			self.tween.stop()
			self.tween = new Tween(self.tweenTarget)
				.to({ scale: self.virtualScale }, 200)
				.onUpdate(() => self.setScale(self.tweenTarget.scale, e))
				.start()
		}, 20)

		this.animate()
	}

	public destroy() {
		this.tween.stop()
		cancelAnimationFrame(this.animationId)
	}

	private animate() {
		this.animationId = requestAnimationFrame(() => {
			update()
			this.update()
			this.animate()
		})
	}

	private setScale(scale: number, e: WheelEvent) {
		const mousePos = this.clientPosToTranslatedPos({ x: e.clientX, y: e.clientY })
		this.scaleFromPoint(scale, mousePos)
	}

	private onPointerDown(event: PointerEvent): void {
		if (event.button === Navigator.MIDDLE_MOUSE_BUTTON) {
			this.isDragging = true
			this.startDrag = { x: event.clientX, y: event.clientY }
			this.triggerElement.setPointerCapture(event.pointerId)
		}
	}

	private onPointerMove(event: PointerEvent): void {
		if (this.isDragging) {
			this.position.x += event.clientX - this.startDrag.x
			this.position.y += event.clientY - this.startDrag.y
			this.startDrag = { x: event.clientX, y: event.clientY }
		}
	}

	private onPonterUp(event: PointerEvent): void {
		if (event.button === Navigator.MIDDLE_MOUSE_BUTTON) {
			this.isDragging = false
			this.triggerElement.releasePointerCapture(event.pointerId)
		}
	}

	private onWheel(e: WheelEvent) {
		this.virtualScale += 1 - 2 ** (e.deltaY * 0.005)
		this.virtualScale = clamp(this.virtualScale, 0.25, 4.0)
		this.setNewScale(e)
	}

	private update() {
		this.element.style.transform = `translate(${this.position.x}px, ${this.position.y}px) scale(${this.scale})`
	}

	private clientPosToTranslatedPos({ x, y }: Vector2) {
		return {
			x: x - this.position.x,
			y: y - this.position.y,
		}
	}

	private scaleFromPoint(newScale: number, focalPt: Vector2) {
		const scaleRatio = newScale / (this.scale != 0 ? this.scale : 1)
		const focalPtDelta = {
			x: this.coordChange(focalPt.x, scaleRatio),
			y: this.coordChange(focalPt.y, scaleRatio),
		}
		this.position = {
			x: this.position.x - focalPtDelta.x,
			y: this.position.y - focalPtDelta.y,
		}
		this.scale = newScale
	}

	private coordChange(coordinate: number, scaleRatio: number) {
		return scaleRatio * coordinate - coordinate
	}
}
