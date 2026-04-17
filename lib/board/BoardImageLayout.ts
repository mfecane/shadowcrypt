import type { BoardImageLayoutApi, BoardImageLayoutPlain } from '~~/lib/board/BoardImageApi'
import type { BoardRect } from '~~/lib/board/BoardRect'

/** Mutable runtime layout (world position, size, flips, stack order). */
export class BoardImageLayout {
	public constructor(
		public zIndex: number = 0,
		public x: number,
		public y: number,
		public w: number,
		public h: number,
		public flipX: boolean,
		public flipY: boolean
	) {}

	public clone(): BoardImageLayout {
		return new BoardImageLayout(this.zIndex, this.x, this.y, this.w, this.h, this.flipX, this.flipY)
	}

	public isEqual(other: BoardImageLayout): boolean {
		return (
			this.zIndex === other.zIndex &&
			this.x === other.x &&
			this.y === other.y &&
			this.w === other.w &&
			this.h === other.h &&
			this.flipX === other.flipX &&
			this.flipY === other.flipY
		)
	}

	public toLayout(): BoardImageLayoutPlain {
		return {
			x: this.x,
			y: this.y,
			w: this.w,
			h: this.h,
			flipX: this.flipX,
			flipY: this.flipY,
		}
	}

	public toApi(): BoardImageLayoutApi {
		return {
			...this.toLayout(),
			zIndex: this.zIndex,
		}
	}

	public static fromApi(api: BoardImageLayoutApi): BoardImageLayout {
		return new BoardImageLayout(api.zIndex, api.x, api.y, api.w, api.h, api.flipX, api.flipY)
	}

	public getRect(): BoardRect {
		return {
			x: this.x,
			y: this.y,
			w: this.w,
			h: this.h,
		}
	}

	public setRect(rect: BoardRect): void {
		this.x = rect.x
		this.y = rect.y
		this.w = rect.w
		this.h = rect.h
	}
}
