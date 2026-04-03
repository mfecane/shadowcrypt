import { defineStore } from 'pinia'
import type { CollectionDetail } from '~/types/collections'
import { Board } from '~~/lib/board/Board'

export const useCollectionViewerStore = defineStore('collectionViewer', {
	state: () => ({
		board: null as Board | null,
		loading: true,
	}),
	actions: {
		clear(): void {
			this.destroyBoard()
			this.loading = true
		},

		async createBoard(
			mountEl: HTMLElement,
			collection: CollectionDetail,
			onPersistSuccess?: () => void
		): Promise<Board> {
			this.destroyBoard()
			const b = new Board(mountEl, collection, onPersistSuccess)
			this.board = b
			await b.init()
			return b
		},

		destroyBoard(): void {
			this.board?.destroy()
			this.board = null
		},

		setLoading(v: boolean): void {
			this.loading = v
		},
	},
})
