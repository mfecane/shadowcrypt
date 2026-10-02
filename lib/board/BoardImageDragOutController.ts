import { fetchFormErrorMessage } from '~~/lib/fetchFormErrorMessage'
import type { BoardVueBridge } from '~~/lib/board/BoardVueBridge'

/** Ghost geometry/identity for the current pointer position, computed by the gesture that owns it. */
export interface DragOutGhostRect {
	imageId: string
	thumbnailUrl: string
	/** Ghost size in client px, matched to the sprite's on-screen size at pickup. */
	width: number
	height: number
	/** Ghost top-left in client px. */
	x: number
	y: number
}

export interface BoardImageDragOutUiState extends DragOutGhostRect {
	hoveredBoardId: string | null
	dropAllowed: boolean
	/** Awaiting the move request after a valid drop; ghost should show a busy state. */
	pending: boolean
}

/**
 * Owns the non-Pixi side of dragging a board image out of the canvas onto another board's
 * sidebar card: publishing the ephemeral UI state through {@link BoardVueBridge} and the move API
 * call. Nothing else: the gesture's own memory (ghost geometry, grab offset) lives on
 * `InteractionContext` for the gesture's duration and is passed in by the caller on every call, so
 * this class holds no session state of its own; hit-testing the hovered board lives in the
 * interaction system (`BoardDropTargetRepository`, surfaced via `InteractionInfo.dropTargetBoardId`);
 * cursor feedback is a view-layer reaction to `dragOut` in `CollectionImageDragGhost.vue`. Pixi-side
 * visuals (dimming the sprite, hiding the transform widget) stay in the calling tool.
 */
export class BoardImageDragOutController {
	public constructor(
		private readonly bridge: BoardVueBridge,
		private readonly sourceBoardId: string,
		private readonly onAccepted: (imageId: string, targetBoardId: string) => void
	) {}

	public publish(ghost: DragOutGhostRect, hoveredBoardId: string | null, pending: boolean): void {
		this.bridge.setDragOut({ ...ghost, hoveredBoardId, dropAllowed: hoveredBoardId !== null, pending })
	}

	/** Resolves true if the image was moved (caller should not restore its Pixi visuals). */
	public async end(ghost: DragOutGhostRect, hoveredBoardId: string | null): Promise<boolean> {
		if (hoveredBoardId === null) {
			this.bridge.setDragOut(null)
			return false
		}

		this.publish(ghost, hoveredBoardId, true)
		try {
			const res = await fetch(`/api/boards/${this.sourceBoardId}/images/${ghost.imageId}/move-to-board`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ targetBoardId: hoveredBoardId }),
			})
			if (!res.ok) {
				const text = await res.text()
				throw new Error(text || `Move failed (${res.status})`)
			}
			this.bridge.setDragOut(null)
			this.onAccepted(ghost.imageId, hoveredBoardId)
			this.bridge.notifyImageMovedToBoard(hoveredBoardId)
			return true
		} catch (e) {
			this.bridge.setDragOut(null)
			this.bridge.setDragOutError(fetchFormErrorMessage(e, 'Could not move image'))
			return false
		}
	}

	public cancel(): void {
		this.bridge.setDragOut(null)
	}
}
