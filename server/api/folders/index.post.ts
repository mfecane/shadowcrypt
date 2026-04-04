import { z } from 'zod'
import { assertAllowed, canCreateResourceRoles } from '~~/server/auth/permissions'
import { folders } from '~~/server/db/schema'
import { useDb } from '~~/server/utils/db'
import { requireSessionUserRoles } from '~~/server/utils/sessionUserId'

const bodySchema = z.object({
	name: z
		.string()
		.min(1)
		.max(256)
		.transform((s: string) => s.trim()),
})

export default defineEventHandler(async (event) => {
	const { userId: sub, roles } = await requireSessionUserRoles(event)
	assertAllowed(canCreateResourceRoles(roles, 'folders'))
	const parsed = bodySchema.parse(await readBody(event))
	const db = useDb()

	const now = new Date()
	const [row] = await db
		.insert(folders)
		.values({
			userId: sub,
			name: parsed.name,
			updatedAt: now,
		})
		.returning()

	if (row === undefined) {
		throw createError({ statusCode: 500, statusMessage: 'Insert failed' })
	}

	return {
		folder: {
			id: row.id,
			name: row.name,
			lastSeenAt: row.lastSeenAt?.toISOString() ?? null,
			createdAt: row.createdAt.toISOString(),
			updatedAt: row.updatedAt.toISOString(),
		},
	}
})
