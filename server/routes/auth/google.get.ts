import { upsertUserFromGoogleProfile } from '~~/lib/auth/googleOAuthUpsert'
import { sessionUserFromRow } from '~~/lib/auth/sessionUser'
import { userProfiles } from '~~/server/db/schema'
import { useDb } from '~~/server/utils/db'

const SESSION_MAX_AGE_SECONDS: number = 30 * 24 * 60 * 60

export default defineOAuthGoogleEventHandler({
	async onSuccess(event, { user }) {
		const u = user as {
			email?: string
			name?: string | null
			picture?: string | null
			email_verified?: boolean
		}
		if (typeof u.email !== 'string') {
			throw createError({ statusCode: 400, message: 'Email required' })
		}
		const row = await upsertUserFromGoogleProfile({
			email: u.email,
			name: u.name,
			picture: u.picture,
			email_verified: u.email_verified,
		})
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
		const q = getQuery(event)
		const redirect =
			typeof q.state === 'string' && q.state.startsWith('/') ? q.state : '/list'
		return sendRedirect(event, redirect)
	},
	onError(event, error) {
		console.error('Google OAuth error:', error)
		return sendRedirect(event, '/auth/gate?error=OAuthCallback')
	},
})
