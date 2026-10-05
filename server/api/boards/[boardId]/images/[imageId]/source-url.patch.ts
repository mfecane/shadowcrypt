import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { assertAllowed, canCrudOwnResourceRoles } from '~~/server/auth/permissions'
import { boards, collections, images } from '~~/server/db/schema'
import { useDb } from '~~/server/utils/db'
import { requireSessionUserRoles } from '~~/server/utils/sessionUserId'

const bodySchema = z.object({
	sourceUrl: z.union([z.string().trim().max(2048), z.literal('')]).nullable(),
})

export default defineEventHandler(async (event) => {
	const { userId: sub, roles } = await requireSessionUserRoles(event)
	assertAllowed(canCrudOwnResourceRoles(roles, 'images', 'update', sub, sub))

	const boardId = getRouterParam(event, 'boardId')
	const imageId = getRouterParam(event, 'imageId')
	if (typeof boardId !== 'string' || boardId === '' || typeof imageId !== 'string' || imageId === '') {
		throw createError({ statusCode: 400, statusMessage: 'Bad request' })
	}

	const parsed = bodySchema.parse(await readBody(event))
	const sourceUrl = parsed.sourceUrl === null || parsed.sourceUrl === '' ? null : parsed.sourceUrl

	const db = useDb()

	const [board] = await db
		.select({ id: boards.id })
		.from(boards)
		.innerJoin(collections, eq(boards.collectionId, collections.id))
		.where(and(eq(boards.id, boardId), eq(collections.userId, sub)))
		.limit(1)

	if (!board) {
		throw createError({ statusCode: 404, statusMessage: 'Not found' })
	}

	const [img] = await db
		.select({ id: images.id })
		.from(images)
		.where(and(eq(images.id, imageId), eq(images.boardId, boardId)))
		.limit(1)

	if (!img) {
		throw createError({ statusCode: 404, statusMessage: 'Not found' })
	}

	await db
		.update(images)
		.set({ sourceUrl, updatedAt: new Date() })
		.where(eq(images.id, imageId))

	return { ok: true, sourceUrl }
})
