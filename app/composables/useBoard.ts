import { storeToRefs } from 'pinia'
import { watch } from 'vue'
import { useCollectionViewerStore } from '~/stores/useCollectionViewerStore'
import type { CollectionDetail } from '~/types/collections'
import { Board } from '~~/lib/board/Board'

export function useBoard(): {
	createBoard: (mountEl: HTMLElement, collection: CollectionDetail) => void
	unsubscribe: (() => void) | null
} {
	const viewerStore = useCollectionViewerStore()
	const { board } = storeToRefs(viewerStore)

	let unsubscribe: (() => void) | null = null

	async function createBoard(mountEl: HTMLElement, collection: CollectionDetail) {
		const board = new Board(mountEl, collection)
		await board.init()
		viewerStore.setBoard(board)
	}

	watch(
		board,
		(b) => {
			if (!b) return
			viewerStore.updateValuesFromBoardBridge()
			unsubscribe = b.bridge.subscribe(() => viewerStore.updateValuesFromBoardBridge())
		},
		{ immediate: true }
	)

	return { createBoard, unsubscribe }
}
