import { and, eq } from 'drizzle-orm'
import { assertAllowed, canCreateResourceRoles } from '~~/server/auth/permissions'
import { boards, collections } from '~~/server/db/schema'
import { useDb } from '~~/server/utils/db'
import { requireSessionUserRoles } from '~~/server/utils/sessionUserId'
import { uploadBoardImage } from '~~/server/utils/uploadBoardImage'

export default defineEventHandler(async (event) => {
	const { userId: sub, roles } = await requireSessionUserRoles(event)
	assertAllowed(canCreateResourceRoles(roles, 'images'))

	const boardId = getRouterParam(event, 'boardId')
	if (typeof boardId !== 'string' || boardId === '') {
		throw createError({ statusCode: 400, statusMessage: 'Bad request' })
	}

	const db = useDb()
	const [board] = await db
		.select({ collectionId: boards.collectionId })
		.from(boards)
		.innerJoin(collections, eq(boards.collectionId, collections.id))
		.where(and(eq(boards.id, boardId), eq(collections.userId, sub)))
		.limit(1)

	if (!board) {
		throw createError({ statusCode: 404, statusMessage: 'Not found' })
	}

	return uploadBoardImage(event, boardId, board.collectionId, sub)
})
