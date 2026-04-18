/** Resolves after two `requestAnimationFrame` ticks (Vue flush + next paint). */
export function waitForNextPaint(): Promise<void> {
	return new Promise((resolve) => {
		requestAnimationFrame(() => {
			requestAnimationFrame(() => resolve())
		})
	})
}
