export class ImageHandler extends EventTarget {
	private static readonly TIMEOUT = 350

	private lastPointerEnd: number = 0
	private lastPointerStart: number = 0

	private cancelSingleClick = false

	// have to handle in navigator
	public constructor(private readonly element?: HTMLDivElement) {
		super()

		if (!this.element) {
			throw 'No target element'
		}

		this.element.addEventListener('pointerdown', (event) => this.onPointerStart(event))
		// this.element.addEventListener('pointermove', () => this.onPonterMove())
		this.element.addEventListener('pointerup', (event) => this.onPointerEnd(event))
	}

	private onPointerStart(event: PointerEvent) {
		event.preventDefault()
		this.lastPointerStart = Date.now()
	}

	private onPointerEnd(event: PointerEvent) {
		event.preventDefault()
		// TODO this shit is hard to get, find better solution
		if (Date.now() - this.lastPointerEnd < ImageHandler.TIMEOUT && this.lastPointerEnd < this.lastPointerStart) {
			this.cancelSingleClick = true
			this.onDoubleClick()
		} else {
			setTimeout(() => this.onClick(), ImageHandler.TIMEOUT)
		}
		this.lastPointerEnd = Date.now()
	}

	private onClick() {
		if (this.cancelSingleClick) {
			this.cancelSingleClick = false
		} else {
			this.dispatchEvent(new CustomEvent('click'))
		}
	}

	private onDoubleClick() {
		this.dispatchEvent(new CustomEvent('doubleclick'))
	}

	private reset() {
		this.lastPointerEnd = 0
		this.cancelSingleClick = true
	}

	// private onPonterMove() {
	// 	// this.reset()
	// }
}
