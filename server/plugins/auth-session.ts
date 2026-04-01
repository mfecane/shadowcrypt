import { eq } from 'drizzle-orm'
import { sessionUserFromRow } from '~~/lib/auth/sessionUser'
import { userProfiles, users } from '~~/server/db/schema'
import { useDb } from '~~/server/utils/db'

export default defineNitroPlugin(() => {
	sessionHooks.hook('fetch', async (session, event) => {
		const id = session.user?.id
		if (typeof id !== 'string' || id === '') {
			return
		}
		const db = useDb()
		const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1)
		if (row === undefined) {
			await clearUserSession(event)
			return
		}
		await db.insert(userProfiles).values({ userId: row.id }).onConflictDoNothing()
		session.user = sessionUserFromRow(row)
	})
})
