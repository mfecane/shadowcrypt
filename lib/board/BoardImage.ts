export interface BoardRect {
	x: number
	y: number
	w: number
	h: number
}

/** DB-mimic image record used by Board. */
export class BoardImage {
	public constructor(
		public readonly id: string,
		public readonly src: string,
		public rect: BoardRect,
		public width: number = 0,
		public height: number = 0
	) {}
}

