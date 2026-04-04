import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { assertAllowed, canCrudOwnResourceRoles } from '~~/server/auth/permissions'
import { folders } from '~~/server/db/schema'
import { useDb } from '~~/server/utils/db'
import { requireSessionUserRoles } from '~~/server/utils/sessionUserId'

const bodySchema = z
	.object({
		name: z
			.string()
			.min(1)
			.max(256)
			.transform((s: string) => s.trim())
			.optional(),
		archived: z.boolean().optional(),
	})
	.superRefine((data, ctx) => {
		if (data.name === undefined && data.archived === undefined) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'Provide name and/or archived',
			})
		}
	})

export default defineEventHandler(async (event) => {
	const { userId: sub, roles } = await requireSessionUserRoles(event)
	assertAllowed(canCrudOwnResourceRoles(roles, 'folders', 'update', sub, sub))

	const id = getRouterParam(event, 'id')
	if (typeof id !== 'string' || id === '') {
		throw createError({ statusCode: 400, statusMessage: 'Missing id' })
	}

	const parsed = bodySchema.parse(await readBody(event))
	const db = useDb()

	const [row] = await db
		.select()
		.from(folders)
		.where(and(eq(folders.id, id), eq(folders.userId, sub)))
		.limit(1)

	if (!row) {
		throw createError({ statusCode: 404, statusMessage: 'Not found' })
	}

	await db
		.update(folders)
		.set({
			...(parsed.name !== undefined ? { name: parsed.name } : {}),
			...(parsed.archived !== undefined ? { archived: parsed.archived } : {}),
			updatedAt: new Date(),
		})
		.where(eq(folders.id, id))

	return { ok: true as const }
})
