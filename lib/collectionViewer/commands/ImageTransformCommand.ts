import type { BoardImageLayout } from '~~/lib/board/BoardImageLayout'
import type { ViewerCommandApplier } from './ViewerCommandApplier'

export class ViewerImageTransformCommand {
	public readonly id = 'viewer_image_transform'

	public constructor(
		public readonly imageId: string,
		private readonly before: BoardImageLayout,
		private readonly after: BoardImageLayout,
		private readonly applier: ViewerCommandApplier
	) {}

	public execute(): void {
		this.applier.applyImageLayout(this.imageId, this.after)
	}

	public undo(): void {
		this.applier.applyImageLayout(this.imageId, this.before)
	}
}
