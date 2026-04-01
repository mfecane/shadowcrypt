export function useCollectionQuickFind() {
	const open = useState('collection-quick-find-open', () => false)

	function openOverlay(): void {
		open.value = true
	}

	function closeOverlay(): void {
		open.value = false
	}

	function toggleOverlay(): void {
		open.value = !open.value
	}

	return { open, openOverlay, closeOverlay, toggleOverlay }
}
