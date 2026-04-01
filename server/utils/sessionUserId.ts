import type { H3Event } from 'h3'

export async function requireSessionUserId(event: H3Event): Promise<string> {
	const session = await requireUserSession(event)
	const id = session.user?.id
	if (typeof id !== 'string' || id === '') {
		throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
	}
	return id
}
