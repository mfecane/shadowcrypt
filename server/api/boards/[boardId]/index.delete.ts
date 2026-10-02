import { and, asc, eq, ne } from 'drizzle-orm'
import { container } from '~~/lib/di/container'
import { ServiceAlias } from '~~/lib/di/ServiceAlias'
import { assertAllowed, canCrudOwnResourceRoles } from '~~/server/auth/permissions'
import { boards, collections, images } from '~~/server/db/schema'
import type { StorageClient } from '~~/server/storage/client/StorageClient'
import { ImageSizeVariant } from '~~/server/storage/ImageSizeVariant'
import type { StorageKeyFactory } from '~~/server/storage/key/StorageKeyFactory'
import { useDb } from '~~/server/utils/db'
import { requireSessionUserRoles } from '~~/server/utils/sessionUserId'

export default defineEventHandler(async (event) => {
	const { userId: sub, roles } = await requireSessionUserRoles(event)
	assertAllowed(canCrudOwnResourceRoles(roles, 'collections', 'delete', sub, sub))

	const boardId = getRouterParam(event, 'boardId')
	if (typeof boardId !== 'string' || boardId === '') {
		throw createError({ statusCode: 400, statusMessage: 'Missing id' })
	}

	const db = useDb()

	const [row] = await db
		.select({ board: boards })
		.from(boards)
		.innerJoin(collections, eq(boards.collectionId, collections.id))
		.where(and(eq(boards.id, boardId), eq(collections.userId, sub)))
		.limit(1)

	if (!row) {
		throw createError({ statusCode: 404, statusMessage: 'Not found' })
	}

	const board = row.board

	const siblingBoards = await db
		.select()
		.from(boards)
		.where(and(eq(boards.collectionId, board.collectionId), ne(boards.id, boardId)))
		.orderBy(asc(boards.createdAt))

	if (siblingBoards.length === 0) {
		throw createError({ statusCode: 400, statusMessage: 'Cannot delete the only board in a collection' })
	}

	const storageKeyFactory = container.resolve<StorageKeyFactory>(ServiceAlias.StorageKeyFactory)
	const storage = container.resolve<StorageClient>(ServiceAlias.StorageClient)

	const imageRows = await db.select().from(images).where(eq(images.boardId, boardId))
	for (const image of imageRows) {
		for (const variant of [ImageSizeVariant.ORIGINAL, ImageSizeVariant.SMALL]) {
			const key = storageKeyFactory.createCollectionImageKey(board.collectionId, variant, image.hash).get()
			await storage.deleteFile(key)
		}
	}

	await db.delete(boards).where(eq(boards.id, boardId))

	if (board.isDefault) {
		const promoted = siblingBoards[0]!
		await db.update(boards).set({ isDefault: true, updatedAt: new Date() }).where(eq(boards.id, promoted.id))
	}

	return { ok: true }
})
