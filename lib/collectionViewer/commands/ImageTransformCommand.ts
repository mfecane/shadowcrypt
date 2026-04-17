import type { BoardImageLayout } from '~~/lib/board/BoardImageLayout'

export class ViewerImageTransformCommand {
	public readonly id = 'viewer_image_transform'

	public constructor(
		public readonly imageId: string,
		private readonly before: BoardImageLayout,
		private readonly after: BoardImageLayout,
		private readonly apply: (imageId: string, s: BoardImageLayout) => void
	) {}

	public execute(): void {
		this.apply(this.imageId, this.after)
	}

	public undo(): void {
		this.apply(this.imageId, this.before)
	}
}
