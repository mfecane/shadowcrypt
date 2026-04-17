import type { ViewerImageLayoutBatchSnapshot } from '~~/lib/collectionViewer/commands/ViewerImageLayoutBatchCommand'

/**
 * Scales all rects so the average of every width and height equals `targetAvgDimension`,
 * then translates so the area-weighted centroid of rectangle centers is at (0, 0).
 * Pure data transform — no undo stack; callers compose into a larger command.
 */
export function normalizeLayoutSnapshotsForFit(
	snapshots: ViewerImageLayoutBatchSnapshot[],
	targetAvgDimension = 500
): ViewerImageLayoutBatchSnapshot[] {
	if (snapshots.length === 0) {
		return []
	}

	let sumW = 0
	let sumH = 0
	for (const s of snapshots) {
		sumW += s.snapshot.w
		sumH += s.snapshot.h
	}
	const n = snapshots.length
	const avgDim = (sumW + sumH) / (2 * n)
	if (avgDim <= 0 || !Number.isFinite(avgDim)) {
		return snapshots.map(cloneLayoutSnapshot)
	}

	const scale = targetAvgDimension / avgDim

	const scaled: ViewerImageLayoutBatchSnapshot[] = snapshots.map((s) => {
		const layout = s.snapshot.clone()
		layout.x *= scale
		layout.y *= scale
		layout.w *= scale
		layout.h *= scale
		return { imageId: s.imageId, snapshot: layout }
	})

	let totalArea = 0
	let sumCx = 0
	let sumCy = 0
	for (const s of scaled) {
		const cx = s.snapshot.x + s.snapshot.w / 2
		const cy = s.snapshot.y + s.snapshot.h / 2
		const a = s.snapshot.w * s.snapshot.h
		totalArea += a
		sumCx += cx * a
		sumCy += cy * a
	}

	let comX = 0
	let comY = 0
	if (totalArea > 0) {
		comX = sumCx / totalArea
		comY = sumCy / totalArea
	} else {
		let uc = 0
		let uy = 0
		for (const s of scaled) {
			uc += s.snapshot.x + s.snapshot.w / 2
			uy += s.snapshot.y + s.snapshot.h / 2
		}
		comX = uc / scaled.length
		comY = uy / scaled.length
	}

	return scaled.map((s) => {
		const layout = s.snapshot.clone()
		layout.x -= comX
		layout.y -= comY
		return { imageId: s.imageId, snapshot: layout }
	})
}

function cloneLayoutSnapshot(s: ViewerImageLayoutBatchSnapshot): ViewerImageLayoutBatchSnapshot {
	return {
		imageId: s.imageId,
		snapshot: s.snapshot.clone(),
	}
}
