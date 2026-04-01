import { and, eq } from 'drizzle-orm'
import { EnvironmentResolver } from '~~/lib/EnvironmentResolver'
import { collections, images } from '~~/server/db/schema'
import { ImageSizeVariant } from '~~/server/storage/ImageSizeVariant'
import { StorageKeyFactory } from '~~/server/storage/key/StorageKeyFactory'
import { useDb } from '~~/server/utils/db'
import { useStorageClient } from '~~/server/utils/storage'

export default defineEventHandler(async (event) => {
	const sub = await requireSessionUserId(event)

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

	const db = useDb()
	const [col] = await db
		.select()
		.from(collections)
		.where(and(eq(collections.id, collectionId), eq(collections.userId, sub)))
		.limit(1)

	if (!col) {
		throw createError({ statusCode: 404, statusMessage: 'Not found' })
	}

	const [img] = await db
		.select()
		.from(images)
		.where(and(eq(images.id, imageId), eq(images.collectionId, collectionId)))
		.limit(1)

	if (!img) {
		throw createError({ statusCode: 404, statusMessage: 'Not found' })
	}

	const storage = useStorageClient()
	const factory = new StorageKeyFactory(new EnvironmentResolver())
	for (const variant of [ImageSizeVariant.ORIGINAL, ImageSizeVariant.SMALL]) {
		const key = factory.createCollectionImageKey(collectionId, variant, img.hash).get()
		await storage.deleteFile(key)
	}

	await db.delete(images).where(eq(images.id, imageId))

	return { ok: true }
})
