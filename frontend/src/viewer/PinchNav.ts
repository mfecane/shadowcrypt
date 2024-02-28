import { Vector2, clamp } from '@/utils/utils'
import { Navigator, NavigatorState } from './Navigator'

export class TouchInteractionState implements NavigatorState {
	private evCache: PointerEvent[] = []

	private prevDist = 0

	private prevPos: Vector2 = { x: 0, y: 0 }

	private virtualScale: number

	public constructor(private readonly navigator: Navigator) {
		this.virtualScale = this.navigator.scale
	}

	public onPointerDown(event: PointerEvent): void {
		this.evCache.push(event)
	}

	public onPointerMove(event: PointerEvent): void {
		this.replaceCachedEvent(event)
		if (this.evCache.length === 2) {
			const dist =
				(this.evCache[1].clientX - this.evCache[0].clientX) ** 2 +
				(this.evCache[1].clientY - this.evCache[0].clientY) ** 2

			const pos: Vector2 = {
				x: (this.evCache[1].clientX + this.evCache[0].clientX) / 2,
				y: (this.evCache[1].clientY + this.evCache[0].clientY) / 2,
			}

			if (this.prevPos.x != 0 && this.prevPos.y != 0) {
				this.handleShift({ x: pos.x - this.prevPos.x, y: pos.y - this.prevPos.y })
			}

			if (this.prevDist > 0) {
				this.handleZoom(this.prevDist - dist)
			}

			this.prevDist = dist
			this.prevPos = pos
		}
	}

	private handleZoom(delta: number) {
		this.virtualScale += 1 - 2 ** (delta * 0.00001)
		// TODO clamp scale in navigator ???
		this.virtualScale = clamp(this.virtualScale, 0.25, 4.0)
		this.setScaleToPoint(this.virtualScale, this.prevPos)
	}

	private handleShift(delta: Vector2) {
		this.navigator.position.x += delta.x
		this.navigator.position.y += delta.y
	}

	public onPointerUp(event: PointerEvent): void {
		this.removeCachedEvent(event)
		this.prevDist = 0
		this.prevPos = { x: 0, y: 0 }
		this.virtualScale = this.navigator.scale
	}

	public onWheel(event: WheelEvent): void {}

	public enterState(): void {}

	public exitState(): void {}

	public setScale(value: number): void {}

	private replaceCachedEvent(event: PointerEvent) {
		const index = this.evCache.findIndex((c) => c.pointerId === event.pointerId)
		if (index == -1) {
			throw new Error('corrupted event')
		}
		this.evCache[index] = event
	}

	private removeCachedEvent(event: PointerEvent) {
		const index = this.evCache.findIndex((c) => c.pointerId === event.pointerId)
		if (index == -1) {
			throw new Error('corrupted event')
		}
		this.evCache.splice(index, 1)
	}

	private setScaleToPoint(scale: number, position: Vector2) {
		const mousePos = this.clientPosToTranslatedPos(position)
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
