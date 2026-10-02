import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { assertAllowed, canCreateResourceRoles } from '~~/server/auth/permissions'
import { boards, collections } from '~~/server/db/schema'
import { useDb } from '~~/server/utils/db'
import { requireSessionUserRoles } from '~~/server/utils/sessionUserId'

const bodySchema = z.object({
	name: z
		.string()
		.min(1)
		.max(256)
		.transform((s: string) => s.trim())
		.optional(),
})

export default defineEventHandler(async (event) => {
	const { userId: sub, roles } = await requireSessionUserRoles(event)
	assertAllowed(canCreateResourceRoles(roles, 'collections'))

	const collectionId = getRouterParam(event, 'id')
	if (typeof collectionId !== 'string' || collectionId === '') {
		throw createError({ statusCode: 400, statusMessage: 'Bad request' })
	}

	const rawBody = await readBody(event)
	const parsed = bodySchema.parse(rawBody ?? {})
	const db = useDb()

	const [col] = await db
		.select()
		.from(collections)
		.where(and(eq(collections.id, collectionId), eq(collections.userId, sub)))
		.limit(1)

	if (!col) {
		throw createError({ statusCode: 404, statusMessage: 'Not found' })
	}

	const existingBoards = await db.select().from(boards).where(eq(boards.collectionId, collectionId))

	const name = parsed.name ?? `Board ${existingBoards.length + 1}`
	const now = new Date()

	const [row] = await db
		.insert(boards)
		.values({
			collectionId,
			name,
			isDefault: false,
			updatedAt: now,
		})
		.returning()

	if (row === undefined) {
		throw createError({ statusCode: 500, statusMessage: 'Insert failed' })
	}

	return {
		board: {
			id: row.id,
			name: row.name,
			isDefault: row.isDefault,
			imageCount: 0,
			updatedAt: row.updatedAt.toISOString(),
			previewImages: [],
		},
	}
})
