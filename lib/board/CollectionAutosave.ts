import { fetchFormErrorMessage } from '~~/lib/fetchFormErrorMessage'
import type { Board } from './Board'
import type { BoardVueBridge } from './BoardVueBridge'

export type LayoutPatchBody = {
	layoutX: number
	layoutY: number
	layoutW: number
	layoutH: number
	layoutZ: number
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

	private static readonly DEBOUNCE_MSEC = 2_000

	public constructor(
		private readonly board: Board,
		private readonly bridge: BoardVueBridge,
		private readonly collectionId: string
	) {}

	private async patchImageLayout(imageId: string, body: LayoutPatchBody): Promise<void> {
		const res = await fetch(`/api/collections/${this.collectionId}/images/${imageId}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
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
			const tasks: Promise<void>[] = layouts.map((l) => {
				const { imageId, ...body } = l
				return this.patchImageLayout(imageId, body)
			})
			if (viewport !== null) {
				tasks.push(this.patchCollectionViewport(viewport))
			}
			await Promise.all(tasks)
			this.board.afterSuccessfulPersist(viewport, layouts)

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
