import type { BoardForBridge } from './BoardForBridge'
import type { BoardImage } from './BoardImage'
import type { BoardImageDragOutUiState } from './BoardImageDragOutController'

export type CollectionSaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export interface BoardBridgeState {
	selectedImageId: string | null
	canUndo: boolean
	canRedo: boolean
	boardId: string | null
	boardName: string
	collectionId: string | null
	fullscreenImage: BoardImage | null
	collectionSaveStatus: CollectionSaveStatus
	collectionSaveError: string | null
	imageCount: number
	ready: boolean
	autoLayoutPending: boolean
	/** Ephemeral drag-out-of-canvas UI state (ghost position, hovered board, pending move). */
	dragOut: BoardImageDragOutUiState | null
}

export class BoardVueBridge {
	public canUndo = false
	public canRedo = false

	public selectedImageId: string | null = null

	public boardId: string | null = null
	public boardName: string = ''
	public collectionId: string | null = null

	public fullscreenImage: BoardImage | null = null

	public collectionSaveStatus: CollectionSaveStatus = 'idle'
	public collectionSaveError: string | null = null

	/** Mirrors Board image count for UI; updated when the collection changes on the Board. */
	public imageCount = 0

	/** True after `Board.init()` / `buildPixi` finishes for the current mount (including empty collections). */
	public ready = false

	public autoLayoutPending = false

	public dragOut: BoardImageDragOutUiState | null = null

	private readonly subscribers = new Set<() => void>()

	private readonly onPersistSuccessSubscribers = new Set<() => void>()

	private readonly onImageMovedToBoardSubscribers = new Set<(targetBoardId: string) => void>()

	private readonly onDragOutErrorSubscribers = new Set<(message: string) => void>()

	public constructor(private readonly board: BoardForBridge) {}

	public subscribe(callback: () => void): () => void {
		this.subscribers.add(callback)
		return () => this.subscribers.delete(callback)
	}

	public subscribeOnPersistSuccess(callback: () => void): () => void {
		this.onPersistSuccessSubscribers.add(callback)
		return () => this.onPersistSuccessSubscribers.delete(callback)
	}

	/** Fires after a drag-out-of-canvas move successfully lands on another board. */
	public subscribeOnImageMovedToBoard(callback: (targetBoardId: string) => void): () => void {
		this.onImageMovedToBoardSubscribers.add(callback)
		return () => this.onImageMovedToBoardSubscribers.delete(callback)
	}

	/** Fires once per failed drag-out-of-canvas move; not persisted in state (one-shot toast). */
	public subscribeOnDragOutError(callback: (message: string) => void): () => void {
		this.onDragOutErrorSubscribers.add(callback)
		return () => this.onDragOutErrorSubscribers.delete(callback)
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

	public setDragOut(state: BoardImageDragOutUiState | null): void {
		this.dragOut = state
		this.notify()
	}

	public notifyImageMovedToBoard(targetBoardId: string): void {
		for (const callback of this.onImageMovedToBoardSubscribers) {
			callback(targetBoardId)
		}
	}

	public setDragOutError(message: string): void {
		for (const callback of this.onDragOutErrorSubscribers) {
			callback(message)
		}
	}

	public getState(): BoardBridgeState {
		return {
			selectedImageId: this.selectedImageId,
			canUndo: this.canUndo,
			canRedo: this.canRedo,
			boardId: this.boardId,
			boardName: this.boardName,
			collectionId: this.collectionId,
			fullscreenImage: this.fullscreenImage,
			collectionSaveStatus: this.collectionSaveStatus,
			collectionSaveError: this.collectionSaveError,
			imageCount: this.imageCount,
			ready: this.ready,
			autoLayoutPending: this.autoLayoutPending,
			dragOut: this.dragOut,
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

	public setBoard(id: string, name: string, collectionId: string): void {
		const changed =
			this.boardId !== id || this.boardName !== name || this.collectionId !== collectionId
		this.boardId = id
		this.boardName = name
		this.collectionId = collectionId
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

	/** Normalize layout scale/COM + fit camera (undoable). */
	public fitIntoView(): void {
		this.board.fitIntoView()
		this.notify()
	}

	public removeImage(imageId: string): void {
		this.board.removeImage(imageId)
		this.notify()
	}

	public setBoardName(name: string): void {
		this.board.setBoardName(name)
		this.notify()
	}

	public autoLayout(): void {
		void this.board.autoLayout()
	}

	public flipSelectedImageX(): void {
		this.board.flipSelectedImageX()
		this.notify()
	}

	public saveNow(): void {
		this.board.saveNow()
	}
}
