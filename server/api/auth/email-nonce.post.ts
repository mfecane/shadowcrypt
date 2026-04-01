import { signInWithEmailNonce } from '~~/lib/auth/emailNonceSignIn'
import { sessionUserFromRow } from '~~/lib/auth/sessionUser'
import { userProfiles } from '~~/server/db/schema'
import { useDb } from '~~/server/utils/db'
import { z } from 'zod'

const SESSION_MAX_AGE_SECONDS: number = 30 * 24 * 60 * 60

const bodySchema = z.object({
	email: z.string().email(),
	code: z.string().min(1),
})

export default defineEventHandler(async (event) => {
	const { email, code } = bodySchema.parse(await readBody(event))
	const row = await signInWithEmailNonce(email, code)
	if (row === null) {
		throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })
	}
	const db = useDb()
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
