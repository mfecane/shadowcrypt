export function useFolderEditModalState() {
	return useState<{ id: string; name: string; archived: boolean } | null>('folder-edit-modal', () => null)
}

export function useCollectionListEditModalState() {
	return useState<{
		id: string
		name: string
		pinned: boolean
		archived: boolean
		folderId: string | null
		/** Present when the folder is not in the active folders list (e.g. archived folder). */
		folder: { id: string; name: string } | null
	} | null>('collection-list-edit-modal', () => null)
}
