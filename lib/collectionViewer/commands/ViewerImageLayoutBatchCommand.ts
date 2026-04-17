import type { BoardImageLayout } from '~~/lib/board/BoardImageLayout'

export interface ViewerImageLayoutBatchSnapshot {
	imageId: string
	snapshot: BoardImageLayout
}

export class ViewerImageLayoutBatchCommand {
	public readonly id = 'viewer_image_layout_batch'

	public constructor(
		private readonly before: ViewerImageLayoutBatchSnapshot[],
		private readonly after: ViewerImageLayoutBatchSnapshot[],
		private readonly apply: (snapshots: ViewerImageLayoutBatchSnapshot[]) => void
	) {}

	public execute(): void {
		this.apply(this.after)
	}

	public undo(): void {
		this.apply(this.before)
	}
}
