export function useFolderEditOverlayState() {
	return useState<{ id: string; name: string; archived: boolean } | null>('folder-edit-overlay', () => null)
}

export function useCollectionEditOverlayState() {
	return useState<{ id: string; pinned: boolean; archived: boolean } | null>(
		'collection-edit-overlay',
		() => null
	)
}
