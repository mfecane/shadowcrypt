import type { BoardRect } from '~~/lib/board/BoardRect'
import type { BoardViewportState } from '~~/lib/board/BoardViewport'

/** Matches {@link NavigationTool} fit padding above the world. */
export const TOP_GUTTER = 8

const EDGE_PAD = 8

export function worldBoundsRectangles(rects: BoardRect[]): {
	minX: number
	minY: number
	maxX: number
	maxY: number
	width: number
	height: number
} {
	if (rects.length === 0) {
		return { minX: 0, minY: 0, maxX: 8, maxY: 8, width: 8, height: 8 }
	}
	let minX = Infinity
	let minY = Infinity
	let maxX = -Infinity
	let maxY = -Infinity
	for (const r of rects) {
		minX = Math.min(minX, r.x)
		minY = Math.min(minY, r.y)
		maxX = Math.max(maxX, r.x + r.w)
		maxY = Math.max(maxY, r.y + r.h)
	}
	minX -= EDGE_PAD
	minY -= EDGE_PAD
	maxX += EDGE_PAD
	maxY += EDGE_PAD
	return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY }
}

/** Center of the axis-aligned bounding box of rects (no padding). Returns (0,0) if empty. */
export function worldBoundsCenter(rects: BoardRect[]): { x: number; y: number } {
	if (rects.length === 0) {
		return { x: 0, y: 0 }
	}
	let minX = Infinity
	let minY = Infinity
	let maxX = -Infinity
	let maxY = -Infinity
	for (const r of rects) {
		minX = Math.min(minX, r.x)
		minY = Math.min(minY, r.y)
		maxX = Math.max(maxX, r.x + r.w)
		maxY = Math.max(maxY, r.y + r.h)
	}
	return { x: (minX + maxX) / 2, y: (minY + maxY) / 2 }
}

/**
 * Viewport (world center + zoom) that matches {@link NavigationTool.fitWorldToView} math
 * for the given padded bounds and viewport size.
 */
export function computeFitViewportSnapshot(
	vw: number,
	vh: number,
	bounds: { minX: number; minY: number; width: number; height: number }
): BoardViewportState {
	const { minX, minY, width: ww, height: wh } = bounds
	let s = 1
	if (ww !== 0) {
		s = Math.min(vw / ww, vh / (wh + TOP_GUTTER))
	}
	if (s > 1) {
		s = 1
	}
	const posX = vw / 2 - (minX + ww / 2) * s
	const posY = (vh + TOP_GUTTER) / 2 - (minY + wh / 2) * s
	const centerX = (vw / 2 - posX) / s
	const centerY = (vh / 2 - posY) / s
	return { centerX, centerY, zoom: s }
}
