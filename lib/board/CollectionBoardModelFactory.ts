import type { CollectionDetail } from '~~/app/types/collections'
import { BoardImage } from '~~/lib/board/BoardImage'
import { BoardImageLayout } from '~~/lib/board/BoardImageLayout'
import { CollectionBoardModel } from '~~/lib/board/CollectionBoardModel'

export class CollectionBoardModelFactory {
	public create(detail: CollectionDetail): CollectionBoardModel {
		const hasViewport =
			detail.viewportCenter !== null && detail.viewportZoom !== null
		const m = new CollectionBoardModel(
			detail.id,
			detail.name,
			detail.pinned,
			detail.archived,
			detail.folderId,
			detail.lastSeenAt,
			detail.updatedAt,
			hasViewport ? { x: detail.viewportCenter!.x, y: detail.viewportCenter!.y } : null,
			hasViewport ? detail.viewportZoom! : null,
			detail.images.map(
				(im, index) =>
					new BoardImage(
						im.id,
						im.url,
						new BoardImageLayout(
							im.layout.zIndex ?? index,
							im.layout.x,
							im.layout.y,
							im.layout.w,
							im.layout.h,
							im.layout.flipX ?? false,
							im.layout.flipY ?? false
						),
						im.width ?? 0,
						im.height ?? 0
					)
			)
		)
		m.sortImagesByZIndex()
		return m
	}
}
