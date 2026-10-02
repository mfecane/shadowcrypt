import { and, eq } from 'drizzle-orm'
import { assertAllowed, canCreateResourceRoles } from '~~/server/auth/permissions'
import { boards, collections } from '~~/server/db/schema'
import { useDb } from '~~/server/utils/db'
import { requireSessionUserRoles } from '~~/server/utils/sessionUserId'
import { uploadBoardImage } from '~~/server/utils/uploadBoardImage'

/** Convenience upload: adds the image to the collection's default board. */
export default defineEventHandler(async (event) => {
	const { userId: sub, roles } = await requireSessionUserRoles(event)
	assertAllowed(canCreateResourceRoles(roles, 'images'))

	const collectionId = getRouterParam(event, 'id')
	if (typeof collectionId !== 'string' || collectionId === '') {
		throw createError({ statusCode: 400, statusMessage: 'Bad request' })
	}

	const db = useDb()
	const [col] = await db
		.select({ id: collections.id })
		.from(collections)
		.where(and(eq(collections.id, collectionId), eq(collections.userId, sub)))
		.limit(1)

	if (!col) {
		throw createError({ statusCode: 404, statusMessage: 'Not found' })
	}

	const [defaultBoard] = await db
		.select({ id: boards.id })
		.from(boards)
		.where(and(eq(boards.collectionId, collectionId), eq(boards.isDefault, true)))
		.limit(1)

	if (!defaultBoard) {
		throw createError({ statusCode: 404, statusMessage: 'Collection has no default board' })
	}

	return uploadBoardImage(event, defaultBoard.id, collectionId, sub)
})
