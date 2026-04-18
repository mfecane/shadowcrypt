import type { BoardViewportState } from '~~/lib/board/BoardViewport'
import type { BoardImageLayout } from '~~/lib/board/BoardImageLayout'

export interface ViewerImageLayoutBatchSnapshot {
	imageId: string
	snapshot: BoardImageLayout
}

/**
 * Single surface for viewer undo/redo commands (typically {@link Board}).
 * Used by layout batch, viewport combo, and single-image transform commands.
 */
export interface ViewerCommandApplier {
	applyLayoutSnapshots(snapshots: ViewerImageLayoutBatchSnapshot[]): void
	applyViewportSnapshot(v: BoardViewportState): void
	applyImageLayout(imageId: string, layout: BoardImageLayout): void
}
