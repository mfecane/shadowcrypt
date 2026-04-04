import { eq } from 'drizzle-orm'
import { assertAllowed, canAccessOwnUserRoles } from '~~/server/auth/permissions'
import { users } from '~~/server/db/schema'
import { useDb } from '~~/server/utils/db'
import { requireSessionUserRoles } from '~~/server/utils/sessionUserId'

export default defineEventHandler(async (event) => {
	const session = await getUserSession(event)
	const id = session.user?.id
	if (typeof id !== 'string' || id === '') {
		return { user: null }
	}
	const { roles } = await requireSessionUserRoles(event)
	assertAllowed(canAccessOwnUserRoles(roles, 'readSelf'))
	const db = useDb()
	const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1)
	if (row === undefined) {
		return { user: null }
	}
	return {
		user: {
			uid: row.id,
			email: row.email,
			name: row.name,
			avatarRef: row.image,
		},
	}
})
