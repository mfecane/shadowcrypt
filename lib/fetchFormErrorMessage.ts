/**
 * Maps `$fetch` / ofetch errors to a short UI string. Uses "Permission denied" for HTTP 403.
 */
export function fetchFormErrorMessage(e: unknown, fallback: string): string {
	if (typeof e === 'object' && e !== null) {
		const o = e as {
			statusCode?: number
			status?: number
			data?: { statusMessage?: string; message?: string }
		}
		const code = o.statusCode ?? o.status
		if (code === 403) {
			return 'Permission denied'
		}
		const d = o.data
		const m = d?.statusMessage ?? d?.message
		if (typeof m === 'string' && m.length > 0) {
			return m
		}
	}
	if (e instanceof Error && e.message.length > 0) {
		return e.message
	}
	return fallback
}
