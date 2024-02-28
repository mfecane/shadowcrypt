import { clamp } from '@/utils/utils'
import { Navigator, NavigatorState } from './Navigator'

// interface EventCache {
//     handled: boolean
//     event: PointerEvent
// }

export class TouchInteractionState implements NavigatorState {
	private evCache: PointerEvent[] = []

	private prevDist = 0

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

			if (this.prevDist > 0) {
				this.handleZoom(dist - this.prevDist)
			}
			this.prevDist = dist
		}
	}

	private handleZoom(delta: number) {
		this.virtualScale += 1 - 2 ** (delta * 0.001)
		this.virtualScale = clamp(this.virtualScale, 0.25, 4.0)
		this.navigator.scale = this.virtualScale
	}

	public onPointerUp(event: PointerEvent): void {
		this.removeCachedEvent(event)
		this.prevDist = 0
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
}
