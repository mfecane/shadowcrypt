export function useImageUploadModal() {
	const route = useRoute()

	const isTargetRoute = computed(() => {
		const p = route.path
		return (
			p === '/list' ||
			/^\/list\/[^/]+$/.test(p) ||
			/^\/collections\/[^/]+$/.test(p) ||
			/^\/folder\/[^/]+$/.test(p)
		)
	})

	const open = useState('image-upload-modal-open', () => false)

	function openModal(): void {
		if (!isTargetRoute.value) {
			return
		}
		open.value = true
	}

	function closeModal(): void {
		open.value = false
	}

	watch(isTargetRoute, (ok) => {
		if (!ok && open.value) {
			closeModal()
		}
	})

	return { open, openModal, closeModal, isTargetRoute }
}
