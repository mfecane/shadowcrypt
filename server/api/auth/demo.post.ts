import { eq } from 'drizzle-orm'
import { sessionUserFromRow } from '~~/lib/auth/sessionUser'
import { userProfiles, users } from '~~/server/db/schema'
import { useDb } from '~~/server/utils/db'

const SESSION_MAX_AGE_SECONDS: number = 30 * 24 * 60 * 60

export default defineEventHandler(async (event) => {
	const config = useRuntimeConfig(event)
	if (config.public.demo !== true) {
		throw createError({ statusCode: 404, statusMessage: 'Not found' })
	}
	const email = config.demoUser
	if (typeof email !== 'string' || email === '') {
		throw createError({ statusCode: 500, statusMessage: 'Demo user email is not configured' })
	}
	const db = useDb()
	const [row] = await db.select().from(users).where(eq(users.email, email)).limit(1)
	if (row === undefined) {
		throw createError({ statusCode: 404, statusMessage: 'Demo user not found' })
	}
	await db.insert(userProfiles).values({ userId: row.id }).onConflictDoNothing()
	await setUserSession(
		event,
		{
			user: sessionUserFromRow(row),
			loggedInAt: Date.now(),
		},
		{ maxAge: SESSION_MAX_AGE_SECONDS }
	)
	return { ok: true as const }
})
