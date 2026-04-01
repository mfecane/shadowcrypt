export function useImageUploadOverlay() {
	const open = useState('image-upload-overlay-open', () => false)

	function openOverlay(): void {
		open.value = true
	}

	function closeOverlay(): void {
		open.value = false
	}

	return { open, openOverlay, closeOverlay }
}
