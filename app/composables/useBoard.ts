import { storeToRefs } from 'pinia'
import { watch } from 'vue'
import { useCollectionViewerStore } from '~/stores/useCollectionViewerStore'
import type { BoardDetail } from '~/types/boards'
import { waitForNextPaint } from '~~/lib/asyncUtils'
import { Board } from '~~/lib/board/Board'

/** Owns one Board instance per viewer mount; safe against unmount during async init. */
export function useBoard(): {
	createBoard: (mountEl: HTMLElement, detail: BoardDetail, collectionId: string) => Promise<void>
	disposeBoard: () => void
} {
	const viewerStore = useCollectionViewerStore()
	const { board } = storeToRefs(viewerStore)

	let readyBoard: Board | null = null
	let disposed = false
	let unsubscribe: (() => void) | null = null

	async function createBoard(mountEl: HTMLElement, detail: BoardDetail, collectionId: string): Promise<void> {
		console.log('[board-loading] create start', detail.id)
		viewerStore.setLoading(true)
		await waitForNextPaint()
		if (disposed) {
			console.log('[board-loading] disposed before init', detail.id)
			return
		}
		const created = new Board(mountEl, detail, collectionId)
		try {
			await created.init()
		} finally {
			// Destroying mid-init would break the renderer's async mount, so it is deferred to here.
			if (disposed) {
				console.log('[board-loading] disposed during init', detail.id)
				created.destroy()
			} else {
				console.log('[board-loading] create done', detail.id)
				readyBoard = created
				viewerStore.setBoard(created)
				viewerStore.setLoading(false)
			}
		}
	}

	function disposeBoard(): void {
		console.log('[board-loading] dispose', readyBoard !== null ? 'ready board' : 'no ready board')
		disposed = true
		unsubscribe?.()
		unsubscribe = null
		if (readyBoard === null) {
			return
		}
		if (board.value === readyBoard) {
			viewerStore.reset()
		}
		readyBoard.destroy()
		readyBoard = null
	}

	watch(
		board,
		(b) => {
			unsubscribe?.()
			unsubscribe = null
			if (!b) return
			viewerStore.updateValuesFromBoardBridge()
			unsubscribe = b.bridge.subscribe(() => viewerStore.updateValuesFromBoardBridge())
		},
		{ immediate: true }
	)

	return { createBoard, disposeBoard }
}
