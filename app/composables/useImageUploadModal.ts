import { useCollectionViewerStore } from '~/stores/useCollectionViewerStore'

export function useImageUploadModal() {
	const route = useRoute()

	const isTargetRoute = computed(() => {
		const p = route.path
		return (
			p === '/list' ||
			/^\/list\/[^/]+$/.test(p) ||
			/^\/collections\/[^/]+$/.test(p) ||
			/^\/collections\/[^/]+\/boards\/[^/]+$/.test(p) ||
			/^\/folder\/[^/]+$/.test(p)
		)
	})

	const boardIdFromRoute = computed(() => {
		const m = /^\/collections\/[^/]+\/boards\/([^/]+)$/.exec(route.path)
		return m?.[1] ?? null
	})

	const collectionIdFromRoute = computed(() => {
		const m = /^\/collections\/([^/]+)(?:\/boards\/[^/]+)?$/.exec(route.path)
		return m?.[1] ?? null
	})

	const viewerStore = useCollectionViewerStore()
	const open = useState('image-upload-modal-open', () => false)
	/** Live client pointer; used as the paste point. */
	const pointerPosition = useState('image-upload-modal-pointer-position', () => ({ x: 0, y: 0 }))
	/** Board world point captured when opened at a position; frozen while the modal is open. */
	const dropWorldPoint = useState<{ x: number; y: number } | null>('image-upload-modal-drop-world-point', () => null)

	function openModal(): void {
		if (!isTargetRoute.value) {
			return
		}
		dropWorldPoint.value = null
		open.value = true
	}

	function openModalAt(clientX: number, clientY: number): void {
		if (!isTargetRoute.value) {
			return
		}
		const board = boardIdFromRoute.value !== null ? viewerStore.board : null
		dropWorldPoint.value = board?.clientToWorld(clientX, clientY) ?? null
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

	return {
		open,
		openModal,
		openModalAt,
		closeModal,
		isTargetRoute,
		pointerPosition,
		dropWorldPoint,
		boardIdFromRoute,
		collectionIdFromRoute,
	}
}
