/** Any DOM element a dragged-out board image can be dropped onto. */
export const BOARD_DROP_TARGET_ATTR = 'data-board-drop-target'

/** Carries the target board id on a {@link BOARD_DROP_TARGET_ATTR} element. */
export const BOARD_DROP_TARGET_ID_ATTR = 'data-board-id'

interface DropTargetCandidate {
	element: HTMLElement
	boardId: string
}

/**
 * Hit-testable DOM drop targets for cross-board image drag-out, owned by the board workspace
 * alongside the Pixi sprite/widget hit testing in {@link InteractionInfo}. The candidate
 * element list is cached by {@link rebuild} (called on drag start and on boards-panel open/close,
 * not on every pointer move); each {@link hitTest} still reads `getBoundingClientRect()` fresh,
 * the same rect-based approach {@link TransformWidget} uses, so geometry is never stale mid-layout
 * (e.g. while the panel is animating open).
 */
export class BoardDropTargetRepository {
	private candidates: DropTargetCandidate[] = []

	public constructor(private readonly sourceBoardId: string) {}

	public rebuild(): void {
		if (typeof document === 'undefined') {
			this.candidates = []
			return
		}
		const elements = document.querySelectorAll<HTMLElement>(`[${BOARD_DROP_TARGET_ATTR}]`)
		this.candidates = [...elements].reduce<DropTargetCandidate[]>((acc, element) => {
			const boardId = element.getAttribute(BOARD_DROP_TARGET_ID_ATTR)
			if (boardId !== null && boardId !== this.sourceBoardId) {
				acc.push({ element, boardId })
			}
			return acc
		}, [])
	}

	public hitTest(clientX: number, clientY: number): string | null {
		for (const { element, boardId } of this.candidates) {
			const rect = element.getBoundingClientRect()
			if (clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom) {
				return boardId
			}
		}
		return null
	}
}
