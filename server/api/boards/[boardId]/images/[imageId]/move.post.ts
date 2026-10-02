import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { EnvironmentResolver } from '~~/lib/EnvironmentResolver'
import { assertAllowed, canCrudOwnResourceRoles } from '~~/server/auth/permissions'
import { boards, collections, images } from '~~/server/db/schema'
import { ImageSizeVariant } from '~~/server/storage/ImageSizeVariant'
import { StorageKeyFactory } from '~~/server/storage/key/StorageKeyFactory'
import { useDb } from '~~/server/utils/db'
import { requireSessionUserRoles } from '~~/server/utils/sessionUserId'
import { useStorageClient } from '~~/server/utils/storage'

const bodySchema = z.object({
	targetCollectionId: z.string().uuid(),
})

export default defineEventHandler(async (event) => {
	const { userId: sub, roles } = await requireSessionUserRoles(event)
	assertAllowed(canCrudOwnResourceRoles(roles, 'images', 'update', sub, sub))

	const boardId = getRouterParam(event, 'boardId')
	const imageId = getRouterParam(event, 'imageId')
	if (typeof boardId !== 'string' || boardId === '' || typeof imageId !== 'string' || imageId === '') {
		throw createError({ statusCode: 400, statusMessage: 'Bad request' })
	}

	const { targetCollectionId } = bodySchema.parse(await readBody(event))

	const db = useDb()
	const storage = useStorageClient()

	const [srcBoard] = await db
		.select({ collectionId: boards.collectionId })
		.from(boards)
		.innerJoin(collections, eq(boards.collectionId, collections.id))
		.where(and(eq(boards.id, boardId), eq(collections.userId, sub)))
		.limit(1)

	if (!srcBoard) {
		throw createError({ statusCode: 404, statusMessage: 'Not found' })
	}

	if (targetCollectionId === srcBoard.collectionId) {
		throw createError({ statusCode: 400, statusMessage: 'Image is already in this collection' })
	}

	const [targetCol] = await db
		.select({ id: collections.id })
		.from(collections)
		.where(and(eq(collections.id, targetCollectionId), eq(collections.userId, sub)))
		.limit(1)

	if (!targetCol) {
		throw createError({ statusCode: 404, statusMessage: 'Target collection not found' })
	}

	const [targetBoard] = await db
		.select({ id: boards.id })
		.from(boards)
		.where(and(eq(boards.collectionId, targetCollectionId), eq(boards.isDefault, true)))
		.limit(1)

	if (!targetBoard) {
		throw createError({ statusCode: 404, statusMessage: 'Target collection has no default board' })
	}

	const [img] = await db
		.select()
		.from(images)
		.where(and(eq(images.id, imageId), eq(images.boardId, boardId)))
		.limit(1)

	if (!img) {
		throw createError({ statusCode: 404, statusMessage: 'Not found' })
	}

	try {
		await storage.copyCollectionImageBetweenCollections(srcBoard.collectionId, targetCollectionId, img.hash)
	} catch (e) {
		throw createError({
			statusCode: 500,
			statusMessage: 'Could not copy image files',
			cause: e,
		})
	}

	try {
		await db
			.update(images)
			.set({
				boardId: targetBoard.id,
				updatedAt: new Date(),
			})
			.where(eq(images.id, imageId))
	} catch (e) {
		const factory = new StorageKeyFactory(new EnvironmentResolver())
		for (const variant of [ImageSizeVariant.ORIGINAL, ImageSizeVariant.SMALL]) {
			const key = factory.createCollectionImageKey(targetCollectionId, variant, img.hash).get()
			await storage.deleteFile(key)
		}
		throw createError({
			statusCode: 500,
			statusMessage: 'Could not update image',
			cause: e,
		})
	}

	const factory = new StorageKeyFactory(new EnvironmentResolver())
	for (const variant of [ImageSizeVariant.ORIGINAL, ImageSizeVariant.SMALL]) {
		const key = factory.createCollectionImageKey(srcBoard.collectionId, variant, img.hash).get()
		await storage.deleteFile(key)
	}

	return { ok: true, targetCollectionId }
})
