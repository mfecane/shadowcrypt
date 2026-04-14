import type { ViewerImageLayoutBatchSnapshot } from './ViewerImageLayoutBatchCommand'

export interface ViewportSnapshot {
	centerX: number
	centerY: number
	zoom: number
}

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
		private readonly beforeViewport: ViewportSnapshot,
		private readonly afterViewport: ViewportSnapshot,
		private readonly applyLayout: (snapshots: ViewerImageLayoutBatchSnapshot[]) => void,
		private readonly applyViewport: (v: ViewportSnapshot) => void,
		id: string = 'viewer_layout_viewport'
	) {
		this.id = id
	}

	public execute(): void {
		this.applyLayout(this.afterLayout)
		this.applyViewport(this.afterViewport)
	}

	public undo(): void {
		this.applyLayout(this.beforeLayout)
		this.applyViewport(this.beforeViewport)
	}
}
