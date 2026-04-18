import type { ViewerCommandApplier, ViewerImageLayoutBatchSnapshot } from './ViewerCommandApplier'

export class ViewerImageLayoutBatchCommand {
	public readonly id = 'viewer_image_layout_batch'

	public constructor(
		private readonly before: ViewerImageLayoutBatchSnapshot[],
		private readonly after: ViewerImageLayoutBatchSnapshot[],
		private readonly applier: ViewerCommandApplier
	) {}

	public execute(): void {
		this.applier.applyLayoutSnapshots(this.after)
	}

	public undo(): void {
		this.applier.applyLayoutSnapshots(this.before)
	}
}
