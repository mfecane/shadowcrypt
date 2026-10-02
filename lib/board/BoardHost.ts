import type { BoardImageLayout } from '~~/lib/board/BoardImageLayout'
import type { DragOutGhostRect } from '~~/lib/board/BoardImageDragOutController'
import type { CollectionAutosave } from '~~/lib/board/CollectionAutosave'

/**
 * Narrow surface the Pixi interaction stack needs from the board (no Pixi imports).
 */
export interface BoardHost {
	readonly autosave: CollectionAutosave

	getViewportSize(): { w: number; h: number }
	getWorldBounds(): { minX: number; minY: number; maxX: number; maxY: number; w: number; h: number }
	syncTransformWidgetFromParentSprite(): void

	openFullscreenById(imageId: string): void
	selectImage(id: string | null): void
	touchImage(imageId: string): void
	commitTransform(imageId: string, before: BoardImageLayout, after: BoardImageLayout): void

	/** Thumbnail src for the drag-out ghost; undefined if the image no longer exists. */
	getImageThumbnailUrl(imageId: string): string | undefined
	/** Publishes (or re-publishes) the drag-out-of-canvas ghost UI state for the given hover target. */
	updateImageDragOut(ghost: DragOutGhostRect, hoveredBoardId: string | null): void
	/** Resolves true if the image was moved to another board (caller should not restore its Pixi visuals). */
	endImageDragOut(ghost: DragOutGhostRect, hoveredBoardId: string | null): Promise<boolean>
	/** Aborts an in-progress drag-out (e.g. Escape) without waiting for pointerup. */
	cancelImageDragOut(): void
}
