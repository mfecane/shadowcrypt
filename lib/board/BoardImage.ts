import type { BoardRect } from '~~/lib/board/BoardRect'
import { BoardImageLayout } from '~~/lib/board/BoardImageLayout'

export class BoardImage {
	public constructor(
		public readonly id: string,
		public readonly src: string,
		public layout: BoardImageLayout,
		public width: number = 0,
		public height: number = 0
	) {}

	public getLayout(): BoardImageLayout {
		return this.layout
	}

	public setLayout(layout: BoardImageLayout): void {
		this.layout = layout
	}

	public getRect(): BoardRect {
		return this.getLayout().getRect()
	}

	public clone(): BoardImage {
		return new BoardImage(this.id, this.src, this.layout.clone(), this.width, this.height)
	}

	public isEqual(other: BoardImage): boolean {
		return (
			this.id === other.id &&
			this.src === other.src &&
			this.width === other.width &&
			this.height === other.height &&
			this.layout.isEqual(other.layout)
		)
	}
}
