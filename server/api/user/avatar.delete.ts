import { eq } from 'drizzle-orm'
import { users } from '~~/server/db/schema'
import { useDb } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
	const sub = await requireSessionUserId(event)

	const db = useDb()
	await db.update(users).set({ image: null, updatedAt: new Date() }).where(eq(users.id, sub))

	return { ok: true as const }
})
