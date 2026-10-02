import type { Renderer } from 'pixi.js'

/** Maps client (page) coordinates to Pixi global space (matches `renderer.screen` and `getBounds()`). */
export function clientToGlobalCoords(
	canvas: HTMLCanvasElement,
	renderer: Renderer,
	clientX: number,
	clientY: number
): { x: number; y: number } {
	const rect = canvas.getBoundingClientRect()
	const sw = renderer.screen.width
	const sh = renderer.screen.height
	return { x: (clientX - rect.left) * (sw / rect.width), y: (clientY - rect.top) * (sh / rect.height) }
}

/** Inverse of {@link clientToGlobalCoords}: Pixi global space to client (page) coordinates. */
export function globalToClientCoords(
	canvas: HTMLCanvasElement,
	renderer: Renderer,
	globalX: number,
	globalY: number
): { x: number; y: number } {
	const rect = canvas.getBoundingClientRect()
	const sw = renderer.screen.width
	const sh = renderer.screen.height
	return { x: rect.left + globalX * (rect.width / sw), y: rect.top + globalY * (rect.height / sh) }
}
