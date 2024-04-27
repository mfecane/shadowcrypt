import { Vector2 } from '@/utils/utils'
import { MouseButton } from './constants'

export interface MouseEventPreFilterOptions {}

export class MouseEventPreFilter extends EventTarget {
	private static readonly DEFAULTS: MouseEventPreFilterOptions = {}

	private isDragging: boolean = false

	private startDrag: Vector2 = { x: 0, y: 0 }

	private options: MouseEventPreFilterOptions | null = MouseEventPreFilter.DEFAULTS

	public constructor(
		private readonly element: HTMLElement,
		options: Partial<MouseEventPreFilterOptions> | null = null
	) {
		super()
		if (options) {
			this.options = { ...this.options, ...options }
		}
		this.setupListeners(this.element)
	}

	private setupListeners(element: HTMLElement): void {
		element.addEventListener('pointerdown', (event) => this.onPointerDown(event))
		element.addEventListener('pointermove', (event) => this.onPointerMove(event))
		element.addEventListener('pointerup', (event) => this.onPointerUp(event))
	}

	private onPointerDown(event: PointerEvent): void {
		if (event.button === MouseButton.middle) {
			this.isDragging = true
			this.startDrag = { x: event.clientX, y: event.clientY }
			this.element.setPointerCapture(event.pointerId)
		}
	}

	private onPointerMove(event: PointerEvent): void {
		if (this.isDragging) {
			const deltaX = event.clientX - this.startDrag.x
			const deltaY = event.clientY - this.startDrag.y
			this.dispatchEvent(
				new CustomEvent('drag', {
					detail: {
						deltaX,
						deltaY,
					},
				})
			)
			this.startDrag = { x: event.clientX, y: event.clientY }
		}
	}

	private onPointerUp(event: PointerEvent): void {
		event.preventDefault()
		event.stopPropagation()
		if (event.button === MouseButton.left) {
			this.dispatchEvent(event)
		} else if (event.button === MouseButton.middle) {
			if (this.isDragging) {
				this.isDragging = false
				this.element.releasePointerCapture(event.pointerId)
			}
		}
	}
}
