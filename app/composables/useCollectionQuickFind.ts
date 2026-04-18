export function useCollectionQuickFind() {
	const open = useState('collection-quick-find-open', () => false)

	function openModal(): void {
		open.value = true
	}

	function closeModal(): void {
		open.value = false
	}

	function toggleModal(): void {
		open.value = !open.value
	}

	return { open, openModal, closeModal, toggleModal }
}
