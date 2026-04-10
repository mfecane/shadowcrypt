export function normalizeAngleDelta(prev: number, next: number): number {
	let d = next - prev
	while (d > Math.PI) {
		d -= 2 * Math.PI
	}
	while (d < -Math.PI) {
		d += 2 * Math.PI
	}
	return d
}
