import { eq } from 'drizzle-orm'
import { assertAllowed, canAccessOwnUserRoles } from '~~/server/auth/permissions'
import { users } from '~~/server/db/schema'
import { useDb } from '~~/server/utils/db'
import { requireSessionUserRoles } from '~~/server/utils/sessionUserId'

export default defineEventHandler(async (event) => {
	const { userId: sub, roles } = await requireSessionUserRoles(event)
	assertAllowed(canAccessOwnUserRoles(roles, 'updateSelf'))

	const db = useDb()
	await db.update(users).set({ image: null, updatedAt: new Date() }).where(eq(users.id, sub))

	return { ok: true as const }
})
