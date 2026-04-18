import type { BoardViewportState } from '~~/lib/board/BoardViewport'
import type { BoardImage } from '~~/lib/board/BoardImage'
import type { BoardImageLayoutApi, BoardImageLayoutSaveRow } from '~~/lib/board/BoardImageApi'

/** Mutable collection snapshot for the board (decoupled from Vue). */
export class CollectionBoardModel {
	public constructor(
		public id: string,
		public name: string,
		public pinned: boolean,
		public archived: boolean,
		public folderId: string | null,
		public lastSeenAt: string | null,
		public updatedAt: string,
		public viewportCenter: { x: number; y: number } | null,
		public viewportZoom: number | null,
		public images: BoardImage[]
	) {}

	public clone(): CollectionBoardModel {
		const c = new CollectionBoardModel(
			this.id,
			this.name,
			this.pinned,
			this.archived,
			this.folderId,
			this.lastSeenAt,
			this.updatedAt,
			this.viewportCenter === null ? null : { x: this.viewportCenter.x, y: this.viewportCenter.y },
			this.viewportZoom,
			this.images.map((im) => im.clone())
		)
		return c
	}

	/** Current viewport for PATCH; null if never set (no saved viewport / nav not synced yet). */
	public getViewportState(): BoardViewportState | null {
		if (this.viewportCenter === null || this.viewportZoom === null) {
			return null
		}
		return {
			centerX: this.viewportCenter.x,
			centerY: this.viewportCenter.y,
			zoom: this.viewportZoom,
		}
	}

	public setName(name: string): void {
		this.name = name
	}

	public setViewportSnapshot(center: { x: number; y: number }, zoom: number): void {
		this.viewportCenter = { x: center.x, y: center.y }
		this.viewportZoom = zoom
	}

	public removeImage(imageId: string): void {
		this.images = this.images.filter((it) => it.id !== imageId)
	}

	public syncImageLayout(imageId: string, layout: BoardImageLayoutApi): void {
		const im = this.images.find((i) => i.id === imageId)
		if (im !== undefined) {
			im.layout.applyFromApi(layout)
		}
	}

	public sortImagesByZIndex(): void {
		this.images.sort((a, b) => a.layout.zIndex - b.layout.zIndex || a.id.localeCompare(b.id))
	}

	public normalizeImageZIndicesForSave(minZ: number): void {
		const ordered = [...this.images].sort(
			(a, b) => a.layout.zIndex - b.layout.zIndex || a.id.localeCompare(b.id)
		)
		for (const [index, im] of ordered.entries()) {
			im.layout.zIndex = minZ + index
		}
		this.sortImagesByZIndex()
	}

	public getDirtyLayouts(baseline: CollectionBoardModel): BoardImageLayoutSaveRow[] {
		const rows: BoardImageLayoutSaveRow[] = []
		const byId = new Map(baseline.images.map((im) => [im.id, im]))
		for (const im of this.images) {
			const prev = byId.get(im.id)
			if (prev === undefined || !im.layout.isEqual(prev.layout)) {
				rows.push({ imageId: im.id, layout: im.layout.toApi() })
			}
		}
		return rows
	}
}
