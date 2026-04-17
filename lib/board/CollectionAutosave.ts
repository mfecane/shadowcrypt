import type { BoardImageLayoutSaveRow } from '~~/lib/board/BoardImageApi'
import type { BoardViewportState } from '~~/lib/board/BoardViewport'
import type { CollectionBoardModel } from '~~/lib/board/CollectionBoardModel'
import { fetchFormErrorMessage } from '~~/lib/fetchFormErrorMessage'
import type { Board } from './Board'
import type { BoardVueBridge } from './BoardVueBridge'

/** Debounced persistence of image layouts and collection viewport; drives {@link BoardVueBridge} save status. */
export class CollectionAutosave {
	private timer: ReturnType<typeof setTimeout> | null = null
	private savedIdleTimer: ReturnType<typeof setTimeout> | null = null
	private disposed = false
	private saving = false
	private pending = false

	private persistedBaseline: CollectionBoardModel

	private static readonly DEBOUNCE_LAYOUT_MS = 2_000
	private static readonly DEBOUNCE_VIEWPORT_MS = 5_000

	public constructor(
		private readonly board: Board,
		private readonly bridge: BoardVueBridge,
		private readonly collectionId: string,
		baseline: CollectionBoardModel
	) {
		this.persistedBaseline = baseline
	}

	private async patchImageLayouts(rows: BoardImageLayoutSaveRow[]): Promise<void> {
		const res = await fetch(`/api/collections/${this.collectionId}/images`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				images: rows.map((r) => ({
					imageId: r.imageId,
					layoutX: r.layout.x,
					layoutY: r.layout.y,
					layoutW: r.layout.w,
					layoutH: r.layout.h,
					layoutZ: r.layout.zIndex,
					layoutFlipX: r.layout.flipX,
					layoutFlipY: r.layout.flipY,
				})),
			}),
		})

		if (!res.ok) {
			const text = await res.text()
			throw new Error(text || `Save failed (${res.status})`)
		}
	}

	private async patchCollectionViewport(body: BoardViewportState): Promise<void> {
		const res = await fetch(`/api/collections/${this.collectionId}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				viewportCenterX: body.centerX,
				viewportCenterY: body.centerY,
				viewportZoom: body.zoom,
			}),
		})

		if (!res.ok) {
			const text = await res.text()
			throw new Error(text || `Viewport save failed (${res.status})`)
		}
	}

	/** Layout / image mutations (faster). */
	public schedule(): void {
		this.scheduleAfter(CollectionAutosave.DEBOUNCE_LAYOUT_MS)
	}

	/** Pan / zoom only (longer debounce). */
	public scheduleViewport(): void {
		this.scheduleAfter(CollectionAutosave.DEBOUNCE_VIEWPORT_MS)
	}

	private scheduleAfter(debounceMs: number): void {
		if (this.disposed) {
			return
		}
		if (this.savedIdleTimer !== null) {
			clearTimeout(this.savedIdleTimer)
			this.savedIdleTimer = null
		}
		if (this.saving) {
			this.pending = true
			return
		}
		if (this.timer !== null) {
			clearTimeout(this.timer)
		}
		this.timer = setTimeout(() => {
			this.timer = null
			void this.runSave()
		}, debounceMs)
	}

	/** Persists immediately (clears pending debounce). If a save is already in flight, queues another run. */
	public saveNow(): void {
		if (this.disposed) {
			return
		}
		if (this.savedIdleTimer !== null) {
			clearTimeout(this.savedIdleTimer)
			this.savedIdleTimer = null
		}
		if (this.timer !== null) {
			clearTimeout(this.timer)
			this.timer = null
		}
		if (this.saving) {
			this.pending = true
			return
		}
		void this.runSave()
	}

	public dispose(): void {
		this.disposed = true
		if (this.timer !== null) {
			clearTimeout(this.timer)
			this.timer = null
		}
		if (this.savedIdleTimer !== null) {
			clearTimeout(this.savedIdleTimer)
			this.savedIdleTimer = null
		}
	}

	private async runSave(): Promise<void> {
		if (this.disposed) {
			return
		}
		if (this.saving) {
			this.pending = true
			return
		}
		this.saving = true
		this.pending = false
		this.bridge.setCollectionSaveState('saving')
		try {
			this.board.syncViewportToModel()
			this.board.prepareModelForSave()
			const model = this.board.getModel()
			const viewport = model.getViewportState()
			const dirtyLayouts = model.getDirtyLayouts(this.persistedBaseline)
			const tasks: Promise<void>[] = []
			if (dirtyLayouts.length > 0) {
				tasks.push(this.patchImageLayouts(dirtyLayouts))
			}
			if (viewport !== null) {
				tasks.push(this.patchCollectionViewport(viewport))
			}

			if (tasks.length > 0) {
				await Promise.all(tasks)
				this.board.afterSuccessfulPersist(dirtyLayouts)
				this.persistedBaseline = this.board.getModel()
			}

			this.bridge.notifyOnPersistSuccess()

			if (this.disposed) {
				return
			}
			this.bridge.setCollectionSaveState('saved')
			if (this.savedIdleTimer !== null) {
				clearTimeout(this.savedIdleTimer)
			}
			this.savedIdleTimer = setTimeout(() => {
				this.savedIdleTimer = null
				if (this.disposed) {
					return
				}
				if (this.bridge.collectionSaveStatus === 'saved') {
					this.bridge.setCollectionSaveState('idle')
				}
			}, 2000)
		} catch (e) {
			if (this.disposed) {
				return
			}
			const msg = fetchFormErrorMessage(e, 'Save failed')
			this.bridge.setCollectionSaveState('error', msg)
		} finally {
			this.saving = false
			if (!this.disposed && this.pending) {
				this.pending = false
				void this.runSave()
			}
		}
	}
}
