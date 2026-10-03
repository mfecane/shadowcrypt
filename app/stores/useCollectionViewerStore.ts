import { defineStore } from 'pinia'
import { Board } from '~~/lib/board/Board'
import type { BoardBridgeState, BoardVueBridge } from '~~/lib/board/BoardVueBridge'

interface CollectionViewerState extends BoardBridgeState {
	board: Board | null
	loading: boolean
}

export const useCollectionViewerStore = defineStore('collectionViewer', {
	state: (): CollectionViewerState => ({
		board: null,
		loading: true,
		selectedImageId: null,
		canUndo: false,
		canRedo: false,
		boardId: null,
		boardName: '',
		collectionId: null,
		fullscreenImage: null,
		collectionSaveStatus: 'idle',
		collectionSaveError: null,
		collectionDirty: false,
		imageCount: 0,
		ready: false,
		autoLayoutPending: false,
		dragOut: null,
	}),
	actions: {
		setBoard(b: Board) {
			this.board = b
		},

		setLoading(v: boolean): void {
			this.loading = v
		},

		updateValuesFromBoardBridge(): void {
			const state = this.board?.bridge.getState()
			if (!state) {
				return
			}
			this.selectedImageId = state.selectedImageId
			this.canUndo = state.canUndo
			this.canRedo = state.canRedo
			this.boardId = state.boardId
			this.boardName = state.boardName
			this.collectionId = state.collectionId
			this.fullscreenImage = state.fullscreenImage
			this.collectionSaveStatus = state.collectionSaveStatus
			this.collectionSaveError = state.collectionSaveError
			this.collectionDirty = state.collectionDirty
			this.imageCount = state.imageCount
			this.ready = state.ready
			this.autoLayoutPending = state.autoLayoutPending
			this.dragOut = state.dragOut
		},

		reset(): void {
			this.selectedImageId = null
			this.canUndo = false
			this.canRedo = false
			this.boardId = null
			this.boardName = ''
			this.collectionId = null
			this.fullscreenImage = null
			this.collectionSaveStatus = 'idle'
			this.collectionSaveError = null
			this.collectionDirty = false
			this.imageCount = 0
			this.ready = false
			this.autoLayoutPending = false
			this.dragOut = null
			this.board = null
			this.loading = true
		},
	},
	getters: {
		bridge: (state): BoardVueBridge | null => state.board?.getBridge() ?? null,
	},
})
