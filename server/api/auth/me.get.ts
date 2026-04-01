import { eq } from 'drizzle-orm'
import { users } from '~~/server/db/schema'
import { useDb } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
	const session = await getUserSession(event)
	const id = session.user?.id
	if (typeof id !== 'string' || id === '') {
		return { user: null }
	}
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
