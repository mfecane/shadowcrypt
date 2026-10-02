const LAST_BOARD_KEY = 'imageUpload.lastBoardId'
const LAST_COLLECTION_KEY = 'imageUpload.lastCollectionId'

export class BoardUploadTracker {
	public recordBoardUpload(boardId: string, collectionId: string): void {
		if (typeof window !== 'undefined') {
			window.sessionStorage.setItem(LAST_BOARD_KEY, boardId)
			window.sessionStorage.setItem(LAST_COLLECTION_KEY, collectionId)
		}
	}

	public getLastBoardId(): string | null {
		if (typeof window !== 'undefined') {
			return window.sessionStorage.getItem(LAST_BOARD_KEY)
		}
		return null
	}

	public getLastCollectionId(): string | null {
		if (typeof window !== 'undefined') {
			return window.sessionStorage.getItem(LAST_COLLECTION_KEY)
		}
		return null
	}

	public clearLastBoard(): void {
		if (typeof window !== 'undefined') {
			window.sessionStorage.removeItem(LAST_BOARD_KEY)
			window.sessionStorage.removeItem(LAST_COLLECTION_KEY)
		}
	}
}
