import type { BoardImage } from './BoardImage'

export type CollectionSaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export class BoardVueBridge {
	public canUndo = false
	public canRedo = false

	public selectedImageId: string | null = null

	public collectionId: string | null = null
	public collectionName: string = ''

	public fullscreenImage: BoardImage | null = null

	public collectionSaveStatus: CollectionSaveStatus = 'idle'
	public collectionSaveError: string | null = null

	/** Mirrors Board image count for UI; updated when the collection changes on the Board. */
	public imageCount = 0

	/** True after `Board.init()` / `buildPixi` finishes for the current mount (including empty collections). */
	public ready = false

	private readonly subscribers = new Set<() => void>()

	public subscribe(callback: () => void): () => void {
		this.subscribers.add(callback)
		return () => this.subscribers.delete(callback)
	}

	public notify(): void {
		for (const callback of this.subscribers) {
			callback()
		}
	}

	public setCanUndo(canUndo: boolean): void {
		if (this.canUndo === canUndo) return
		this.canUndo = canUndo
		this.notify()
	}

	public setCanRedo(canRedo: boolean): void {
		if (this.canRedo === canRedo) return
		this.canRedo = canRedo
		this.notify()
	}

	public setSelectedImageId(id: string | null): void {
		if (this.selectedImageId === id) return
		this.selectedImageId = id
		this.notify()
	}

	public setCollection(id: string, name: string): void {
		const changed = this.collectionId !== id || this.collectionName !== name
		this.collectionId = id
		this.collectionName = name
		if (changed) this.notify()
	}

	public openFullscreen(image: BoardImage): void {
		if (this.fullscreenImage?.id === image.id) return
		this.fullscreenImage = image
		this.notify()
	}

	public closeFullscreen(): void {
		if (this.fullscreenImage === null) return
		this.fullscreenImage = null
		this.notify()
	}

	public setCollectionSaveState(status: CollectionSaveStatus, errorMessage?: string | null): void {
		const nextError = status === 'error' ? (errorMessage ?? 'Unknown error') : null
		if (this.collectionSaveStatus === status && this.collectionSaveError === nextError) {
			return
		}
		this.collectionSaveStatus = status
		this.collectionSaveError = nextError
		this.notify()
	}

	public setImageCount(n: number): void {
		if (this.imageCount === n) return
		this.imageCount = n
		this.notify()
	}

	public setReady(v: boolean): void {
		if (this.ready === v) return
		this.ready = v
		this.notify()
	}
}
