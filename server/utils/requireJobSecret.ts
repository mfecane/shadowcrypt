import type { H3Event } from 'h3'

export function requireJobSecret(event: H3Event): void {
	const expected = useRuntimeConfig(event).jobSecret
	if (typeof expected !== 'string' || expected === '') {
		throw new Error('runtimeConfig.jobSecret is not configured')
	}
	if (getHeader(event, 'x-job-secret') !== expected) {
		throw createError({ statusCode: 403, statusMessage: 'Invalid job secret' })
	}
}
