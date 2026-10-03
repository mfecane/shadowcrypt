import type { BoardImageApi } from '~~/lib/board/BoardImageApi'

export interface BoardPreviewImage {
	url: string
	width: number | null
	height: number | null
}

export interface CollectionBoardSummary {
	id: string
	name: string
	imageCount: number
	updatedAt: string
	previewImages: BoardPreviewImage[]
}

export interface BoardDetail {
	id: string
	collectionId: string
	name: string
	/** World-space center of the viewport when last saved; null = use fit-to-view on load. */
	viewportCenter: { x: number; y: number } | null
	/** Uniform zoom; null = use fit-to-view on load. */
	viewportZoom: number | null
	images: BoardImageApi[]
}
