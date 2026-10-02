import { and, desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { assertAllowed, canCrudOwnResourceRoles } from '~~/server/auth/permissions'
import { boards, collections, images } from '~~/server/db/schema'
import { useDb } from '~~/server/utils/db'
import { requireSessionUserRoles } from '~~/server/utils/sessionUserId'

const CASCADE_OFFSET_PX = 24

const bodySchema = z.object({
	targetBoardId: z.string().uuid(),
})

export default defineEventHandler(async (event) => {
	const { userId: sub, roles } = await requireSessionUserRoles(event)
	assertAllowed(canCrudOwnResourceRoles(roles, 'images', 'update', sub, sub))

	const boardId = getRouterParam(event, 'boardId')
	const imageId = getRouterParam(event, 'imageId')
	if (typeof boardId !== 'string' || boardId === '' || typeof imageId !== 'string' || imageId === '') {
		throw createError({ statusCode: 400, statusMessage: 'Bad request' })
	}

	const { targetBoardId } = bodySchema.parse(await readBody(event))
	if (targetBoardId === boardId) {
		throw createError({ statusCode: 400, statusMessage: 'Image is already on this board' })
	}

	const db = useDb()

	const [srcBoard] = await db
		.select({ collectionId: boards.collectionId })
		.from(boards)
		.innerJoin(collections, eq(boards.collectionId, collections.id))
		.where(and(eq(boards.id, boardId), eq(collections.userId, sub)))
		.limit(1)

	if (!srcBoard) {
		throw createError({ statusCode: 404, statusMessage: 'Not found' })
	}

	const [targetBoard] = await db
		.select({ id: boards.id, collectionId: boards.collectionId })
		.from(boards)
		.innerJoin(collections, eq(boards.collectionId, collections.id))
		.where(and(eq(boards.id, targetBoardId), eq(collections.userId, sub)))
		.limit(1)

	if (!targetBoard) {
		throw createError({ statusCode: 404, statusMessage: 'Target board not found' })
	}

	if (targetBoard.collectionId !== srcBoard.collectionId) {
		throw createError({ statusCode: 400, statusMessage: 'Target board is in a different collection' })
	}

	const [img] = await db
		.select()
		.from(images)
		.where(and(eq(images.id, imageId), eq(images.boardId, boardId)))
		.limit(1)

	if (!img) {
		throw createError({ statusCode: 404, statusMessage: 'Not found' })
	}

	const [topImage] = await db
		.select({ zIndex: images.zIndex })
		.from(images)
		.where(eq(images.boardId, targetBoardId))
		.orderBy(desc(images.zIndex))
		.limit(1)
	const nextZIndex = (topImage?.zIndex ?? -1) + 1

	const now = new Date()
	const [updated] = await db
		.update(images)
		.set({
			boardId: targetBoardId,
			zIndex: nextZIndex,
			layoutX: (nextZIndex % 8) * CASCADE_OFFSET_PX,
			layoutY: (nextZIndex % 8) * CASCADE_OFFSET_PX,
			updatedAt: now,
		})
		.where(and(eq(images.id, imageId), eq(images.boardId, boardId)))
		.returning()

	if (!updated) {
		throw createError({ statusCode: 500, statusMessage: 'Move failed' })
	}

	return {
		ok: true,
		boardId: targetBoardId,
		layout: {
			x: updated.layoutX,
			y: updated.layoutY,
			w: updated.layoutW,
			h: updated.layoutH,
			flipX: updated.layoutFlipX,
			flipY: updated.layoutFlipY,
			zIndex: updated.zIndex,
		},
	}
})
