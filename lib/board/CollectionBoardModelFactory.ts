import type { CollectionDetail } from '~~/app/types/collections'
import { CollectionBoardModel } from '~~/lib/board/CollectionBoardModel'

export class CollectionBoardModelFactory {
	public create(detail: CollectionDetail): CollectionBoardModel {
		const m = new CollectionBoardModel(
			detail.id,
			detail.name,
			detail.pinned,
			detail.archived,
			detail.folderId,
			detail.lastSeenAt,
			detail.updatedAt,
			{ x: detail.viewportCenter?.x ?? 0, y: detail.viewportCenter?.y ?? 0 },
			detail.viewportZoom ?? 1,
			detail.images.map((im) => ({
				id: im.id,
				url: im.url,
				width: im.width,
				height: im.height,
				layout: { x: im.layout.x, y: im.layout.y, w: im.layout.w, h: im.layout.h },
			}))
		)
		return m
	}
}
