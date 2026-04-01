import { onBeforeUnmount, reactive, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useCollectionViewerStore } from '~/stores/collectionViewer'
import type { BoardVueBridge, CollectionSaveStatus } from '~~/lib/board/BoardVueBridge'
import type { BoardImage } from '~~/lib/board/BoardImage'

export interface BoardBridgeState {
	selectedImageId: string | null
	canUndo: boolean
	canRedo: boolean
	collectionId: string | null
	collectionName: string
	fullscreenImage: BoardImage | null
	collectionSaveStatus: CollectionSaveStatus
	collectionSaveError: string | null
	imageCount: number
	ready: boolean
}

function snapshotFromBridge(bridge: BoardVueBridge): BoardBridgeState {
	return {
		selectedImageId: bridge.selectedImageId,
		canUndo: bridge.canUndo,
		canRedo: bridge.canRedo,
		collectionId: bridge.collectionId,
		collectionName: bridge.collectionName,
		fullscreenImage: bridge.fullscreenImage,
		collectionSaveStatus: bridge.collectionSaveStatus,
		collectionSaveError: bridge.collectionSaveError,
		imageCount: bridge.imageCount,
		ready: bridge.ready,
	}
}

export function useBoardBridgeState(): { bridge: BoardVueBridge | null; state: BoardBridgeState } {
	const viewerStore = useCollectionViewerStore()
	const { board } = storeToRefs(viewerStore)

	const state = reactive<BoardBridgeState>({
		selectedImageId: null,
		canUndo: false,
		canRedo: false,
		collectionId: null,
		collectionName: '',
		fullscreenImage: null,
		collectionSaveStatus: 'idle',
		collectionSaveError: null,
		imageCount: 0,
		ready: false,
	})

	let unsubscribe: (() => void) | null = null

	const stop = watch(
		board,
		(b) => {
			unsubscribe?.()
			unsubscribe = null
			if (!b) {
				Object.assign(state, {
					selectedImageId: null,
					canUndo: false,
					canRedo: false,
					collectionId: null,
					collectionName: '',
					fullscreenImage: null,
					collectionSaveStatus: 'idle',
					collectionSaveError: null,
					imageCount: 0,
					ready: false,
				})
				return
			}
			Object.assign(state, snapshotFromBridge(b.bridge))
			unsubscribe = b.bridge.subscribe(() => {
				Object.assign(state, snapshotFromBridge(b.bridge))
			})
		},
		{ immediate: true }
	)

	onBeforeUnmount(() => {
		stop()
		unsubscribe?.()
		unsubscribe = null
	})

	return { bridge: board.value?.bridge ?? null, state }
}
