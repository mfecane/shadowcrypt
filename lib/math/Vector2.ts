export class Vector2 {
	public constructor(
		public readonly x: number,
		public readonly y: number
	) {}

	public static from(x: number, y: number): Vector2 {
		return new Vector2(x, y)
	}

	public static fromEvent(event: PointerEvent): Vector2 {
		return new Vector2(event.clientX, event.clientY)
	}
}
