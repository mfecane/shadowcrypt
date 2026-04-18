import type { BoardViewportState } from '~~/lib/board/BoardViewport'
import type { ViewerCommandApplier, ViewerImageLayoutBatchSnapshot } from './ViewerCommandApplier'

/**
 * Single undo/redo step: applies a batch of image rects and one viewport together.
 * Callers may run pure preprocessing (e.g. normalize in memory, WASM layout) before
 * constructing before/after snapshots; only one command is pushed.
 */
export class ViewerLayoutViewportCommand {
	public readonly id: string

	public constructor(
		private readonly beforeLayout: ViewerImageLayoutBatchSnapshot[],
		private readonly afterLayout: ViewerImageLayoutBatchSnapshot[],
		private readonly beforeViewport: BoardViewportState,
		private readonly afterViewport: BoardViewportState,
		private readonly applier: ViewerCommandApplier,
		id: string = 'viewer_layout_viewport'
	) {
		this.id = id
	}

	public execute(): void {
		this.applier.applyLayoutSnapshots(this.afterLayout)
		this.applier.applyViewportSnapshot(this.afterViewport)
	}

	public undo(): void {
		this.applier.applyLayoutSnapshots(this.beforeLayout)
		this.applier.applyViewportSnapshot(this.beforeViewport)
	}
}
