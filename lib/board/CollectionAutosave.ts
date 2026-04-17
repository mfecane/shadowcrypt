import { fetchFormErrorMessage } from '~~/lib/fetchFormErrorMessage'
import type { Board } from './Board'
import type { BoardVueBridge } from './BoardVueBridge'

export type LayoutPatchBody = {
	layoutX: number
	layoutY: number
	layoutW: number
	layoutH: number
	layoutZ: number
	layoutFlipX: boolean
	layoutFlipY: boolean
}

export type CollectionLayoutRow = {
	imageId: string
} & LayoutPatchBody

/** Debounced persistence of image layouts and collection viewport; drives {@link BoardVueBridge} save status. */
export class CollectionAutosave {
	private timer: ReturnType<typeof setTimeout> | null = null
	private savedIdleTimer: ReturnType<typeof setTimeout> | null = null
	private disposed = false
	private saving = false
	private pending = false
	private readonly persistedImageLayoutById = new Map<string, LayoutPatchBody>()
	private persistedViewport: { centerX: number; centerY: number; zoom: number } | null = null

	private static readonly DEBOUNCE_MSEC = 5_000

	public constructor(
		private readonly board: Board,
		private readonly bridge: BoardVueBridge,
		private readonly collectionId: string
	) {
		for (const layout of this.board.layoutRowsForSave()) {
			const { imageId, ...body } = layout
			this.persistedImageLayoutById.set(imageId, body)
		}
		this.persistedViewport = this.board.viewportForSave()
	}

	private static equalLayout(a: LayoutPatchBody, b: LayoutPatchBody): boolean {
		return (
			a.layoutX === b.layoutX &&
			a.layoutY === b.layoutY &&
			a.layoutW === b.layoutW &&
			a.layoutH === b.layoutH &&
			a.layoutZ === b.layoutZ &&
			a.layoutFlipX === b.layoutFlipX &&
			a.layoutFlipY === b.layoutFlipY
		)
	}

	private static equalViewport(
		a: { centerX: number; centerY: number; zoom: number } | null,
		b: { centerX: number; centerY: number; zoom: number } | null
	): boolean {
		if (a === null || b === null) {
			return a === b
		}
		return a.centerX === b.centerX && a.centerY === b.centerY && a.zoom === b.zoom
	}

	private async patchImageLayouts(rows: CollectionLayoutRow[]): Promise<void> {
		const res = await fetch(`/api/collections/${this.collectionId}/images`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ images: rows }),
		})

		if (!res.ok) {
			const text = await res.text()
			throw new Error(text || `Save failed (${res.status})`)
		}
	}

	private async patchCollectionViewport(body: { centerX: number; centerY: number; zoom: number }): Promise<void> {
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

	public schedule(): void {
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
		}, CollectionAutosave.DEBOUNCE_MSEC)
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
			const layouts = this.board.layoutRowsForSave()
			const viewport = this.board.viewportForSave()
			const dirtyLayouts = layouts.filter((layout) => {
				const { imageId, ...body } = layout
				const prev = this.persistedImageLayoutById.get(imageId)
				return prev === undefined || !CollectionAutosave.equalLayout(prev, body)
			})
			const tasks: Promise<void>[] = []
			if (dirtyLayouts.length > 0) {
				tasks.push(this.patchImageLayouts(dirtyLayouts))
			}
			const viewportChanged = !CollectionAutosave.equalViewport(this.persistedViewport, viewport)
			if (viewport !== null && viewportChanged) {
				tasks.push(this.patchCollectionViewport(viewport))
			}
			if (tasks.length > 0) {
				await Promise.all(tasks)
				this.board.afterSuccessfulPersist(viewportChanged ? viewport : null, dirtyLayouts)
				for (const layout of dirtyLayouts) {
					const { imageId, ...body } = layout
					this.persistedImageLayoutById.set(imageId, body)
				}
				if (viewportChanged) {
					this.persistedViewport = viewport
				}
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
