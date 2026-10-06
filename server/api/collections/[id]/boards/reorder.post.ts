import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { assertAllowed, canCrudOwnResourceRoles } from '~~/server/auth/permissions'
import { boards, collections } from '~~/server/db/schema'
import { useDb } from '~~/server/utils/db'
import { requireSessionUserRoles } from '~~/server/utils/sessionUserId'

const bodySchema = z.object({
	boardIds: z.array(z.string().uuid()).min(1),
})

export default defineEventHandler(async (event) => {
	const { userId: sub, roles } = await requireSessionUserRoles(event)
	assertAllowed(canCrudOwnResourceRoles(roles, 'collections', 'update', sub, sub))

	const collectionId = getRouterParam(event, 'id')
	if (typeof collectionId !== 'string' || collectionId === '') {
		throw createError({ statusCode: 400, statusMessage: 'Bad request' })
	}

	const { boardIds } = bodySchema.parse(await readBody(event))
	const db = useDb()

	const [col] = await db
		.select({ id: collections.id })
		.from(collections)
		.where(and(eq(collections.id, collectionId), eq(collections.userId, sub)))
		.limit(1)
	if (!col) {
		throw createError({ statusCode: 404, statusMessage: 'Not found' })
	}

	const existing = await db.select({ id: boards.id }).from(boards).where(eq(boards.collectionId, collectionId))
	const existingIds = new Set(existing.map((b) => b.id))
	if (boardIds.length !== existingIds.size || new Set(boardIds).size !== boardIds.length || !boardIds.every((id) => existingIds.has(id))) {
		throw createError({ statusCode: 400, statusMessage: 'boardIds must list every board of the collection exactly once' })
	}

	await db.transaction(async (tx) => {
		for (const [index, id] of boardIds.entries()) {
			await tx.update(boards).set({ sortOrder: index }).where(eq(boards.id, id))
		}
	})

	return { ok: true }
})
