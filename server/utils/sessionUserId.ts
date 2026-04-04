import type { H3Event } from 'h3'
import { eq } from 'drizzle-orm'
import type { UserRole } from '~~/server/db/schema'
import { users } from '~~/server/db/schema'
import { useDb } from '~~/server/utils/db'

export async function requireSessionUserId(event: H3Event): Promise<string> {
	const session = await requireUserSession(event)
	const id = session.user?.id
	if (typeof id !== 'string' || id === '') {
		throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
	}
	return id
}

export async function requireSessionUserRoles(event: H3Event): Promise<{ userId: string; roles: UserRole[] }> {
	const session = await requireUserSession(event)
	const id = session.user?.id
	if (typeof id !== 'string' || id === '') {
		throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
	}
	const db = useDb()
	const [row] = await db.select({ roles: users.roles }).from(users).where(eq(users.id, id)).limit(1)
	if (row === undefined) {
		throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
	}
	return { userId: id, roles: row.roles }
}
