import type { NavigationTool } from '~~/lib/board/interaction/tools/NavigationTool'
import type { ImageCommandController } from '~~/lib/collectionViewer/commands/ImageCommandController'

export interface BoardForBridge {
	commandController: ImageCommandController
	navigationTool: NavigationTool | null
	removeImage: (imageId: string) => void
	setBoardName: (name: string) => void
	autoLayout: () => Promise<void>
	flipSelectedImageX: () => void
	undo: () => void
	redo: () => void
	saveNow: () => void
	fitIntoView: () => void
}
