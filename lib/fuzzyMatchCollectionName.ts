/**
 * Subsequence fuzzy match: query characters appear in order in `text`.
 * Higher score is better; `null` means no match.
 */
export function fuzzyScoreSubsequence(query: string, text: string): number | null {
	const q = query.trim().toLowerCase()
	const t = text.toLowerCase()
	if (q === '') {
		return 0
	}
	let ti = 0
	let score = 0
	let run = 0
	for (let qi = 0; qi < q.length; qi++) {
		const ch = q[qi]!
		let found = false
		while (ti < t.length) {
			if (t[ti] === ch) {
				run++
				score += 12 + run * 4 - ti * 0.02
				ti++
				found = true
				break
			}
			run = 0
			ti++
		}
		if (!found) {
			return null
		}
	}
	score += Math.max(0, 40 - t.length * 0.15)
	return score
}

export function rankByFuzzyName<T extends { name: string; pinned?: boolean }>(
	items: T[],
	query: string
): T[] {
	const q = query.trim()
	if (q === '') {
		return [...items].sort((a, b) => {
			const ap = a.pinned === true
			const bp = b.pinned === true
			if (ap !== bp) {
				return ap ? -1 : 1
			}
			return a.name.localeCompare(b.name)
		})
	}
	return [...items]
		.map((item) => ({ item, s: fuzzyScoreSubsequence(q, item.name) }))
		.filter((x): x is { item: T; s: number } => x.s !== null)
		.sort((a, b) => {
			if (b.s !== a.s) {
				return b.s - a.s
			}
			const ap = a.item.pinned === true
			const bp = b.item.pinned === true
			if (ap !== bp) {
				return ap ? -1 : 1
			}
			return a.item.name.localeCompare(b.item.name)
		})
		.map((x) => x.item)
}
