import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { users } from '~~/server/db/schema'
import { useDb } from '~~/server/utils/db'

const patchBodySchema = z.object({
	name: z
		.string()
		.max(128)
		.transform((s: string) => s.trim())
		.transform((s: string) => (s === '' ? null : s)),
})

export default defineEventHandler(async (event) => {
	const sub = await requireSessionUserId(event)
	const parsed = patchBodySchema.parse(await readBody(event))
	const db = useDb()
	await db
		.update(users)
		.set({ name: parsed.name, updatedAt: new Date() })
		.where(eq(users.id, sub))
	return { ok: true }
})
