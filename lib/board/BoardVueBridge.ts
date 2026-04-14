import type { NavigationTool } from '~~/lib/board/interaction/tools/NavigationTool'
import type { ImageCommandController } from '~~/lib/collectionViewer/commands/ImageCommandController'
import type { BoardImage } from './BoardImage'

export type CollectionSaveStatus = 'idle' | 'saving' | 'saved' | 'error'

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
	autoLayoutPending: boolean
}

interface BoardForBridge {
	commandController: ImageCommandController
	navigationTool: NavigationTool | null
	removeImage: (imageId: string) => void
	setCollectionName: (name: string) => void
	autoLayout: () => Promise<void>
	undo: () => void
	redo: () => void
	saveNow: () => void
}

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

	public autoLayoutPending = false

	private readonly subscribers = new Set<() => void>()

	private readonly onPersistSuccessSubscribers = new Set<() => void>()

	public constructor(private readonly board: BoardForBridge) {}

	public subscribe(callback: () => void): () => void {
		this.subscribers.add(callback)
		return () => this.subscribers.delete(callback)
	}

	public subscribeOnPersistSuccess(callback: () => void): () => void {
		this.onPersistSuccessSubscribers.add(callback)
		return () => this.onPersistSuccessSubscribers.delete(callback)
	}

	public notify(): void {
		for (const callback of this.subscribers) {
			callback()
		}
	}

	public notifyOnPersistSuccess(): void {
		for (const callback of this.onPersistSuccessSubscribers) {
			callback()
		}
	}

	public getState(): BoardBridgeState {
		return {
			selectedImageId: this.selectedImageId,
			canUndo: this.canUndo,
			canRedo: this.canRedo,
			collectionId: this.collectionId,
			collectionName: this.collectionName,
			fullscreenImage: this.fullscreenImage,
			collectionSaveStatus: this.collectionSaveStatus,
			collectionSaveError: this.collectionSaveError,
			imageCount: this.imageCount,
			ready: this.ready,
			autoLayoutPending: this.autoLayoutPending,
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

	public setAutoLayoutPending(v: boolean): void {
		const changed = this.autoLayoutPending !== v
		this.autoLayoutPending = v
		// Always notify when entering pending: Pinia can miss an update if the bridge already had true
		// (e.g. notify while store.board was null) so `if (pending === v) return` would skip a resync.
		if (changed || v) {
			this.notify()
		}
	}

	public undo(): void {
		this.board.undo()
	}

	public redo(): void {
		this.board.redo()
	}

	public fitWorldToView(): void {
		this.board.navigationTool?.fitWorldToView()
		this.notify()
	}

	public removeImage(imageId: string): void {
		this.board.removeImage(imageId)
		this.notify()
	}

	public setCollectionName(name: string): void {
		this.board.setCollectionName(name)
		this.notify()
	}

	public autoLayout(): void {
		void this.board.autoLayout()
	}

	public saveNow(): void {
		this.board.saveNow()
	}
}
