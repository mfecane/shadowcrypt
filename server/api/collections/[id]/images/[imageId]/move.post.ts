import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { EnvironmentResolver } from '~~/lib/EnvironmentResolver'
import { assertAllowed, canCrudOwnResourceRoles } from '~~/server/auth/permissions'
import { collections, images } from '~~/server/db/schema'
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

	const collectionId = getRouterParam(event, 'id')
	const imageId = getRouterParam(event, 'imageId')
	if (
		typeof collectionId !== 'string' ||
		collectionId === '' ||
		typeof imageId !== 'string' ||
		imageId === ''
	) {
		throw createError({ statusCode: 400, statusMessage: 'Bad request' })
	}

	const { targetCollectionId } = bodySchema.parse(await readBody(event))

	if (targetCollectionId === collectionId) {
		throw createError({ statusCode: 400, statusMessage: 'Image is already in this collection' })
	}

	const db = useDb()
	const storage = useStorageClient()

	const [srcCol] = await db
		.select()
		.from(collections)
		.where(and(eq(collections.id, collectionId), eq(collections.userId, sub)))
		.limit(1)

	if (!srcCol) {
		throw createError({ statusCode: 404, statusMessage: 'Not found' })
	}

	const [targetCol] = await db
		.select()
		.from(collections)
		.where(and(eq(collections.id, targetCollectionId), eq(collections.userId, sub)))
		.limit(1)

	if (!targetCol) {
		throw createError({ statusCode: 404, statusMessage: 'Target collection not found' })
	}

	const [img] = await db
		.select()
		.from(images)
		.where(and(eq(images.id, imageId), eq(images.collectionId, collectionId)))
		.limit(1)

	if (!img) {
		throw createError({ statusCode: 404, statusMessage: 'Not found' })
	}

	try {
		await storage.copyCollectionImageBetweenCollections(collectionId, targetCollectionId, img.hash)
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
				collectionId: targetCollectionId,
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
		const key = factory.createCollectionImageKey(collectionId, variant, img.hash).get()
		await storage.deleteFile(key)
	}

	return { ok: true, targetCollectionId }
})
