import { eq } from 'drizzle-orm'
import type { UserRow } from '~~/lib/auth/sessionUser'
import { users } from '~~/server/db/schema'
import { useDb } from '~~/server/utils/db'

type GoogleProfile = {
	email: string
	name?: string | null
	picture?: string | null
	email_verified?: boolean
}

export async function upsertUserFromGoogleProfile(profile: GoogleProfile): Promise<UserRow> {
	const emailVerifiedAt: Date | null = profile.email_verified === true ? new Date() : null
	const emailNorm: string = profile.email.trim().toLowerCase()
	const db = useDb()
	return await db.transaction(async (tx) => {
		const upserted = await tx
			.insert(users)
			.values({
				email: emailNorm,
				name: profile.name ?? null,
				image: profile.picture ?? null,
				emailVerified: emailVerifiedAt,
			})
			.onConflictDoUpdate({
				target: users.email,
				set: {
					name: profile.name ?? null,
					image: profile.picture ?? null,
					emailVerified: emailVerifiedAt,
					updatedAt: new Date(),
				},
			})
			.returning()
		let dbUser = upserted[0]
		if (dbUser === undefined) {
			const [fromDb] = await tx.select().from(users).where(eq(users.email, emailNorm)).limit(1)
			dbUser = fromDb
		}
		if (dbUser === undefined) {
			throw new Error('upsertUserFromGoogleProfile: google upsert returned no row')
		}
		return dbUser
	})
}
