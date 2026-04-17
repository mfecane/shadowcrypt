import type { CollectionAutosave } from '~~/lib/board/CollectionAutosave'
import type { BoardImageLayout } from '~~/lib/board/BoardImageLayout'

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
}
