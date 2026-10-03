import { and, eq } from 'drizzle-orm'
import { assertAllowed, canCreateResourceRoles } from '~~/server/auth/permissions'
import { collections } from '~~/server/db/schema'
import { useDb } from '~~/server/utils/db'
import { resolveCollectionTargetBoardId } from '~~/server/utils/resolveCollectionTargetBoardId'
import { requireSessionUserRoles } from '~~/server/utils/sessionUserId'
import { uploadBoardImage } from '~~/server/utils/uploadBoardImage'

/** Convenience upload: adds the image to the collection's current board. */
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

	const boardId = await resolveCollectionTargetBoardId(db, collectionId)
	return uploadBoardImage(event, boardId, collectionId, sub)
})
