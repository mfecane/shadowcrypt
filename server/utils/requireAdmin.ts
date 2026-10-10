import type { H3Event } from 'h3'
import { requireSessionUserRoles } from '~~/server/utils/sessionUserId'

export async function requireAdmin(event: H3Event): Promise<void> {
	const { roles } = await requireSessionUserRoles(event)
	if (!roles.includes('admin')) {
		throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
	}
}
