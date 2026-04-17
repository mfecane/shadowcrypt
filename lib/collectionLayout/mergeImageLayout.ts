import { computeDefaultLayoutRects } from '~~/lib/collectionLayout/computeDefaultLayoutRects'
import type { BoardRect } from '~~/lib/board/BoardRect'

export type ImageRowForLayout = {
	id: string
	width: number | null
	height: number | null
	layoutX: number | null
	layoutY: number | null
	layoutW: number | null
	layoutH: number | null
}

function hasStoredLayout(row: ImageRowForLayout): boolean {
	return (
		row.layoutX !== null &&
		row.layoutY !== null &&
		row.layoutW !== null &&
		row.layoutH !== null
	)
}

export function mergeImageLayouts(rows: ImageRowForLayout[]): Map<string, BoardRect> {
	if (rows.length === 0) {
		return new Map()
	}
	const defaults = computeDefaultLayoutRects(rows)
	const out = new Map<string, BoardRect>()
	for (const row of rows) {
		if (hasStoredLayout(row)) {
			out.set(row.id, {
				x: row.layoutX as number,
				y: row.layoutY as number,
				w: row.layoutW as number,
				h: row.layoutH as number,
			})
		} else {
			const d = defaults.get(row.id)
			if (d === undefined) {
				throw new Error(`mergeImageLayouts: missing default for image ${row.id}`)
			}
			out.set(row.id, d)
		}
	}
	return out
}
