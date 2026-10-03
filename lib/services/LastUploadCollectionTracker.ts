const LAST_COLLECTION_KEY = 'imageUpload.lastCollectionId'

/** Remembers the upload target collection for the session; the board is resolved server-side (collection's current board). */
export class LastUploadCollectionTracker {
	public record(collectionId: string): void {
		window.sessionStorage.setItem(LAST_COLLECTION_KEY, collectionId)
	}

	public getLastCollectionId(): string | null {
		return window.sessionStorage.getItem(LAST_COLLECTION_KEY)
	}
}
