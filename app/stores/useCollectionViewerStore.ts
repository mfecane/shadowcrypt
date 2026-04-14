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
		collectionId: null,
		collectionName: '',
		fullscreenImage: null,
		collectionSaveStatus: 'idle',
		collectionSaveError: null,
		imageCount: 0,
		ready: false,
		autoLayoutPending: false,
	}),
	actions: {
		clear(): void {
			this.destroyBoard()
			this.loading = true
		},

		setBoard(b: Board) {
			this.board = b
		},

		destroyBoard(): void {
			this.board?.destroy()
			this.board = null
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
			this.collectionId = state.collectionId
			this.collectionName = state.collectionName
			this.fullscreenImage = state.fullscreenImage
			this.collectionSaveStatus = state.collectionSaveStatus
			this.collectionSaveError = state.collectionSaveError
			this.imageCount = state.imageCount
			this.ready = state.ready
			this.autoLayoutPending = state.autoLayoutPending
		},

		reset(): void {
			this.selectedImageId = null
			this.canUndo = false
			this.canRedo = false
			this.collectionId = null
			this.collectionName = ''
			this.fullscreenImage = null
			this.collectionSaveStatus = 'idle'
			this.collectionSaveError = null
			this.imageCount = 0
			this.ready = false
			this.autoLayoutPending = false
			this.board = null
			this.loading = true
		},
	},
	getters: {
		bridge: (state): BoardVueBridge | null => state.board?.getBridge() ?? null,
	},
})
