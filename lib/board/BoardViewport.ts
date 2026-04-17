/** World-space viewport for navigation, undo, and PATCH (center + uniform zoom). */
export interface BoardViewportState {
	centerX: number
	centerY: number
	zoom: number
}
