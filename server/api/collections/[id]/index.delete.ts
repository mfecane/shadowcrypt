import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { container } from '~~/lib/di/container'
import { ServiceAlias } from '~~/lib/di/ServiceAlias'
import { collections, images } from '~~/server/db/schema'
import type { StorageClient } from '~~/server/storage/client/StorageClient'
import { ImageSizeVariant } from '~~/server/storage/ImageSizeVariant'
import { StorageKeyFactory } from '~~/server/storage/key/StorageKeyFactory'
import { useDb } from '~~/server/utils/db'

const bodySchema = z.object({
	id: z.string().uuid(),
})

export default defineEventHandler(async (event) => {
	try {
		const userId = await requireSessionUserId(event)

		const parsed = bodySchema.parse(await readBody(event))

		const db = useDb()

		const storageKeyFactory = container.resolve<StorageKeyFactory>(ServiceAlias.StorageKeyFactory)

		const storage = container.resolve<StorageClient>(ServiceAlias.StorageClient)

		const [collection] = await db
			.select()
			.from(collections)
			.where(and(eq(collections.id, parsed.id), eq(collections.userId, userId)))
			.limit(1)

		if (!collection) {
			throw createError({ statusCode: 404, statusMessage: 'Not found' })
		}

		const imagesRows = await db.select().from(images).where(eq(images.collectionId, parsed.id))

		for (const image of imagesRows) {
			for (const variant of [ImageSizeVariant.ORIGINAL, ImageSizeVariant.SMALL]) {
				const key = storageKeyFactory.createCollectionImageKey(parsed.id, variant, image.hash).get()
				await storage.deleteFile(key)
			}

			await db.delete(images).where(eq(images.id, image.id))
		}

		await db.delete(collections).where(eq(collections.id, parsed.id))

		return { ok: true }
	} catch (error) {
		if (error instanceof z.ZodError) {
			throw createError({ statusCode: 400, statusMessage: 'Bad request', data: error.format() })
		}
		throw createError({ statusCode: 500, statusMessage: 'Internal server error' })
	}
})
