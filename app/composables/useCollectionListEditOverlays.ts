export function useFolderEditOverlayState() {
	return useState<{ id: string; name: string; archived: boolean } | null>('folder-edit-overlay', () => null)
}

export function useCollectionEditOverlayState() {
	return useState<{
		id: string
		name: string
		pinned: boolean
		archived: boolean
		folderId: string | null
		/** Present when the folder is not in the active folders list (e.g. archived folder). */
		folder: { id: string; name: string } | null
	} | null>('collection-edit-overlay', () => null)
}
