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
	public id: string

	public name: string

	public pinned: boolean

	public archived: boolean

	public folderId: string | null

	public lastSeenAt: string | null

	public updatedAt: string

	public viewportCenter: { x: number; y: number } | null

	public viewportZoom: number | null

	public images: BoardModelImage[]

	private constructor() {
		this.id = ''
		this.name = ''
		this.pinned = false
		this.archived = false
		this.folderId = null
		this.lastSeenAt = null
		this.updatedAt = ''
		this.viewportCenter = null
		this.viewportZoom = null
		this.images = []
	}

	public static fromDetail(detail: CollectionDetail): CollectionBoardModel {
		const m = new CollectionBoardModel()
		m.id = detail.id
		m.name = detail.name
		m.pinned = detail.pinned
		m.archived = detail.archived
		m.folderId = detail.folderId
		m.lastSeenAt = detail.lastSeenAt
		m.updatedAt = detail.updatedAt
		m.viewportCenter =
			detail.viewportCenter !== null ? { x: detail.viewportCenter.x, y: detail.viewportCenter.y } : null
		m.viewportZoom = detail.viewportZoom
		m.images = detail.images.map((im) => ({
			id: im.id,
			url: im.url,
			width: im.width,
			height: im.height,
			layout: { x: im.layout.x, y: im.layout.y, w: im.layout.w, h: im.layout.h },
		}))
		return m
	}

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
				layout: { x: im.layout.x, y: im.layout.y, w: im.layout.w, h: im.layout.h },
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
			im.layout = { x: layout.x, y: layout.y, w: layout.w, h: layout.h }
		}
	}
}
