import { and, desc, eq, gt, isNull } from 'drizzle-orm'
import { EmailNonceService } from '~~/lib/auth/emailNonce'
import { emailNonceVerifySchema } from '~~/lib/auth/emailNonceContract'
import type { UserRow } from '~~/lib/auth/sessionUser'
import { container } from '~~/lib/di/container'
import { ServiceAlias } from '~~/lib/di/ServiceAlias'
import { emailLoginNonces, users } from '~~/server/db/schema'
import { useDb } from '~~/server/utils/db'

export async function signInWithEmailNonce(email: string, code: string): Promise<UserRow | null> {
	const parsed = emailNonceVerifySchema.parse({ email, code })
	const nonceService = container.resolve<EmailNonceService>(ServiceAlias.EmailNonceService)
	const db = useDb()
	const now = new Date()
	const expectedNonceHash = nonceService.hashNonce(parsed.email, parsed.code)
	return await db.transaction(async (tx) => {
		const [nonceRecord] = await tx
			.select()
			.from(emailLoginNonces)
			.where(
				and(
					eq(emailLoginNonces.email, parsed.email),
					eq(emailLoginNonces.nonceHash, expectedNonceHash),
					isNull(emailLoginNonces.consumedAt),
					gt(emailLoginNonces.expiresAt, now)
				)
			)
			.orderBy(desc(emailLoginNonces.createdAt))
			.limit(1)
		if (nonceRecord === undefined) {
			return null
		}
		await tx
			.update(emailLoginNonces)
			.set({ consumedAt: now })
			.where(eq(emailLoginNonces.id, nonceRecord.id))
		const upserted = await tx
			.insert(users)
			.values({ email: parsed.email, name: null, emailVerified: now })
			.onConflictDoUpdate({
				target: users.email,
				set: { updatedAt: now, emailVerified: now },
			})
			.returning()
		let dbUser = upserted[0]
		if (dbUser === undefined) {
			const [fromDb] = await tx.select().from(users).where(eq(users.email, parsed.email)).limit(1)
			dbUser = fromDb
		}
		if (dbUser === undefined) {
			throw new Error('signInWithEmailNonce: user upsert returned no row')
		}
		return dbUser
	})
}
