import type { BoardImageLayoutApi } from '~~/lib/board/BoardImageApi'
import type { CollectionBoardSummary } from '~/types/boards'

export interface CollectionListItem {
	id: string
	name: string
	pinned: boolean
	archived: boolean
	folderId: string | null
	folder: { id: string; name: string } | null
	lastSeenAt: string | null
	updatedAt: string
	imageCount: number
	images: { id: string; url: string; width: number | null; height: number | null }[]
}

export interface CollectionFolderBlock {
	id: string
	name: string
	lastSeenAt: string | null
	updatedAt: string
	collections: CollectionListItem[]
	archivedCollections: CollectionListItem[]
}

export interface ArchivedFolderSummary {
	id: string
	name: string
	lastSeenAt: string | null
	updatedAt: string
}

export type CollectionListFilter = 'recent' | 'folders' | 'archived'

export interface CollectionsListResponse {
	pinned: CollectionListItem[]
	folders: CollectionFolderBlock[]
	ungrouped: CollectionListItem[]
	archivedFolders: ArchivedFolderSummary[]
	archivedUngrouped: CollectionListItem[]
}

export interface FolderDetailResponse {
	folder: {
		id: string
		name: string
		archived: boolean
		lastSeenAt: string | null
		updatedAt: string
	}
	collections: CollectionListItem[]
	archivedCollections: CollectionListItem[]
}

/** Response from `POST /api/collections/:id/images`. */
export interface CollectionImageUploadResponse {
	image: {
		id: string
		url: string
		width: number | null
		height: number | null
		layout: BoardImageLayoutApi
	}
}

export interface CollectionMeta {
	id: string
	name: string
	pinned: boolean
	archived: boolean
	folderId: string | null
	lastSeenAt: string | null
	updatedAt: string
	boards: CollectionBoardSummary[]
}
