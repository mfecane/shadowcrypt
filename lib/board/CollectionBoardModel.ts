import type { CollectionDetail, CollectionImageLayout } from '../../app/types/collections'

export type BoardModelImage = {
	id: string
	url: string
	width: number | null
	height: number | null
	layout: CollectionImageLayout
}

/**
 * Mutable plain-data snapshot of a collection for the Pixi board (decoupled from Vue readonly proxies).
 */
export class CollectionBoardModel {
	public constructor(
		public id: string,
		public name: string,
		public pinned: boolean,
		public archived: boolean,
		public folderId: string | null,
		public lastSeenAt: string | null,
		public updatedAt: string,
		public viewportCenter: { x: number; y: number },
		public viewportZoom: number,
		public images: BoardModelImage[]
	) {}

	/** Plain {@link CollectionDetail} for typing or cache updates; does not alias mutable internals. */
	public clone(): CollectionDetail {
		return {
			id: this.id,
			name: this.name,
			pinned: this.pinned,
			archived: this.archived,
			folderId: this.folderId,
			lastSeenAt: this.lastSeenAt,
			updatedAt: this.updatedAt,
			viewportCenter:
				this.viewportCenter !== null ? { x: this.viewportCenter.x, y: this.viewportCenter.y } : null,
			viewportZoom: this.viewportZoom,
			images: this.images.map((im) => ({
				id: im.id,
				url: im.url,
				width: im.width,
				height: im.height,
				layout: { x: im.layout.x, y: im.layout.y, w: im.layout.w, h: im.layout.h, zIndex: im.layout.zIndex },
			})),
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

	public syncImageLayout(imageId: string, layout: CollectionImageLayout): void {
		const im = this.images.find((i) => i.id === imageId)
		if (im !== undefined) {
			im.layout = { x: layout.x, y: layout.y, w: layout.w, h: layout.h, zIndex: layout.zIndex }
		}
	}

	public sortImagesByZIndex(): void {
		this.images.sort((a, b) => a.layout.zIndex - b.layout.zIndex || a.id.localeCompare(b.id))
	}
}
