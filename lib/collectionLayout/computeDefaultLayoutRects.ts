import type { LayoutRect } from '~~/lib/collectionLayout/types'

const GAP = 4
const BASE = 400

export function computeDefaultLayoutRects(
	images: { id: string; width: number | null; height: number | null }[]
): Map<string, LayoutRect> {
	const out = new Map<string, LayoutRect>()
	const n = images.length
	if (n === 0) {
		return out
	}
	const cols = Math.max(1, Math.ceil(Math.sqrt(n)))
	let i = 0
	let y = 0
	while (i < n) {
		let x = 0
		let rowHeight = 0
		for (let c = 0; c < cols && i < n; c++) {
			const im = images[i]!
			const iw = im.width ?? 1
			const ih = im.height ?? 1
			const aspect = ih / iw
			const w = BASE
			const h = BASE * aspect
			out.set(im.id, { x, y, w, h })
			rowHeight = Math.max(rowHeight, h)
			x += w + GAP
			i++
		}
		y += rowHeight + GAP
	}
	return out
}
