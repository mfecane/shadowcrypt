import type { BoardVueBridge } from '~~/lib/board/BoardVueBridge'

export interface Command {
	readonly id: string
	execute(): void
	undo(): void
}

export class ImageCommandController {
	public constructor(private readonly bridge: BoardVueBridge) {}

	private undoStack: Command[] = []
	private redoStack: Command[] = []

	public execute(cmd: Command): void {
		cmd.execute()
		this.undoStack.push(cmd)
		this.redoStack = []
	}

	public undo(): void {
		const cmd = this.undoStack.pop()
		if (!cmd) {
			return
		}
		cmd.undo()
		this.redoStack.push(cmd)
		this.bridge.setCanUndo(this.canUndo())
	}

	public redo(): void {
		const cmd = this.redoStack.pop()
		if (!cmd) {
			return
		}
		cmd.execute()
		this.undoStack.push(cmd)
		this.bridge.setCanRedo(this.canRedo())
	}

	public canUndo(): boolean {
		return this.undoStack.length > 0
	}

	public canRedo(): boolean {
		return this.redoStack.length > 0
	}

	public clearStacks(): void {
		this.undoStack = []
		this.redoStack = []
	}
}
