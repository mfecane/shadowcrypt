export function useImageUploadedToast() {
	const toast = useToast()

	/** Confirms an upload made outside the target collection, offering navigation to it. */
	function showImageUploadedToast(target: { collectionId: string; collectionName: string | null; boardId: string | null }): void {
		const path =
			target.boardId !== null
				? `/collections/${target.collectionId}/boards/${target.boardId}`
				: `/collections/${target.collectionId}`
		toast.add({
			title: 'Image added',
			description: target.collectionName !== null ? `Added to “${target.collectionName}”.` : undefined,
			icon: 'i-lucide-check',
			color: 'success',
			actions: [
				{
					label: 'Go to collection',
					icon: 'i-lucide-arrow-right',
					color: 'neutral',
					variant: 'outline',
					onClick: () => {
						void navigateTo(path)
					},
				},
			],
		})
	}

	return { showImageUploadedToast }
}
