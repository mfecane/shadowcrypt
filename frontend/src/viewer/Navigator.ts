import { Tween, update } from '@tweenjs/tween.js'
import { clamp } from '../utils/utils'

type Vector2 = { x: number; y: number }

export class Navigator {
	private static readonly MIDDLE_MOUSE_BUTTON = 1
	private static readonly TOP_GUTTER = 60
	private static readonly STEP = 100

	private position: Vector2 = { x: 0, y: 0 }

	private scale: number = 1

	private virtualScale: number = 1

	private isDragging: boolean = false

	private startDrag: Vector2 = { x: 0, y: 0 }

	private tweenTarget = { scale: 1 }

	private tween: Tween<{ scale: number }> = new Tween(this.tweenTarget)

	private animationId: number = -1

	private defaultWidth: number

	private defaultHeight: number

	public constructor(private readonly container: HTMLDivElement, private readonly element: HTMLDivElement) {
		this.container.addEventListener('pointerdown', (event) => this.onPointerDown(event))
		this.container.addEventListener('pointermove', (event) => this.onPointerMove(event))
		this.container.addEventListener('pointerup', (event) => this.onPonterUp(event))
		this.container.addEventListener('wheel', (event) => this.onWheel(event))
		window.addEventListener('keydown', (event) => this.onKeyPress(event))

		const box = this.element.getBoundingClientRect()
		this.defaultWidth = box.width
		this.defaultHeight = box.height

		this.animate()
	}

	public destroy() {
		this.tween.stop()
		cancelAnimationFrame(this.animationId)
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

	private setScale(scale: number) {
		this.scale = scale
		this.tweenTarget.scale = scale
		this.virtualScale = scale
	}

	private animate() {
		this.animationId = requestAnimationFrame(() => {
			update()
			this.update()
			this.animate()
		})
	}

	private isMiddleMouseOrPointer(event: PointerEvent): boolean {
		if (event.pointerType === 'mouse') {
			return event.button === Navigator.MIDDLE_MOUSE_BUTTON
		} else if (event.pointerType === 'touch') {
			return true
		}
		return false
	}

	private onPointerDown(event: PointerEvent): void {
		if (this.isMiddleMouseOrPointer(event)) {
			this.isDragging = true
			this.startDrag = { x: event.clientX, y: event.clientY }
			this.container.setPointerCapture(event.pointerId)
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
		if (this.isDragging) {
			this.isDragging = false
			this.container.releasePointerCapture(event.pointerId)
		}
	}

	private tou() {}

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

	private onWheel(e: WheelEvent) {
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

	private update() {
		this.element.style.transform = `translate(${this.position.x}px, ${this.position.y}px) scale(${this.scale})`
	}

	private setScaleToPoint(scale: number, e: WheelEvent) {
		const mousePos = this.clientPosToTranslatedPos({ x: e.clientX, y: e.clientY })
		this.scaleFromPoint(scale, mousePos)
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
