import { randomUUID } from 'node:crypto'
import { and, eq } from 'drizzle-orm'
import { readMultipartFormData } from 'h3'
import { mergeImageLayouts } from '~~/lib/collectionLayout/mergeImageLayout'
import { MAX_COLLECTION_IMAGE_UPLOAD_BYTES } from '~~/lib/collectionImageUploadConstants'
import { getCollectionImageStoredDimensions } from '~~/lib/imageSharpProcessing'
import { EnvironmentResolver } from '~~/lib/EnvironmentResolver'
import { collections, images } from '~~/server/db/schema'
import { ImageSizeVariant } from '~~/server/storage/ImageSizeVariant'
import { StorageKeyFactory } from '~~/server/storage/key/StorageKeyFactory'
import { useDb } from '~~/server/utils/db'
import { useStorageClient } from '~~/server/utils/storage'

const storageKeyFactory = new StorageKeyFactory(new EnvironmentResolver())

export default defineEventHandler(async (event) => {
	const sub = await requireSessionUserId(event)

	const collectionId = getRouterParam(event, 'id')
	if (typeof collectionId !== 'string' || collectionId === '') {
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

	const parts = await readMultipartFormData(event)
	const file = parts?.find((p) => p.name === 'file')
	if (file === undefined || file.data.length === 0) {
		throw createError({ statusCode: 400, statusMessage: 'Missing file' })
	}
	if (file.data.length > MAX_COLLECTION_IMAGE_UPLOAD_BYTES) {
		throw createError({ statusCode: 400, statusMessage: 'File too large' })
	}
	const mime = file.type ?? ''
	if (!mime.startsWith('image/')) {
		throw createError({ statusCode: 400, statusMessage: 'Not an image' })
	}

	let dims: { width: number; height: number }
	try {
		dims = await getCollectionImageStoredDimensions(file.data)
	} catch {
		throw createError({ statusCode: 400, statusMessage: 'Invalid or unsupported image' })
	}

	const hash = randomUUID()
	const storage = useStorageClient()
	let uploaded = false

	try {
		await storage.uploadCollectionImage(collectionId, hash, file.data)
		uploaded = true

		const [inserted] = await db
			.insert(images)
			.values({
				collectionId,
				userId: sub,
				hash,
				width: dims.width,
				height: dims.height,
			})
			.returning()

		if (inserted === undefined) {
			throw createError({ statusCode: 500, statusMessage: 'Upload failed' })
		}

		const imageRows = await db.select().from(images).where(eq(images.collectionId, collectionId))

		const layouts = mergeImageLayouts(
			imageRows.map((img) => ({
				id: img.id,
				width: img.width,
				height: img.height,
				layoutX: img.layoutX,
				layoutY: img.layoutY,
				layoutW: img.layoutW,
				layoutH: img.layoutH,
			}))
		)

		const layout = layouts.get(inserted.id)
		if (layout === undefined) {
			await db.delete(images).where(eq(images.id, inserted.id))
			throw createError({ statusCode: 500, statusMessage: 'Upload failed' })
		}

		await db
			.update(images)
			.set({
				layoutX: layout.x,
				layoutY: layout.y,
				layoutW: layout.w,
				layoutH: layout.h,
				updatedAt: new Date(),
			})
			.where(eq(images.id, inserted.id))

		const publicUrl = storageKeyFactory
			.createCollectionImageKey(collectionId, ImageSizeVariant.ORIGINAL, hash)
			.getPublicUrl()

		return {
			image: {
				id: inserted.id,
				url: publicUrl,
				width: dims.width,
				height: dims.height,
				layout: {
					x: layout.x,
					y: layout.y,
					w: layout.w,
					h: layout.h,
				},
			},
		}
	} catch (e: unknown) {
		if (uploaded) {
			await deleteCollectionImageObjects(storage, collectionId, hash)
		}
		throw e
	}
})

async function deleteCollectionImageObjects(
	storage: ReturnType<typeof useStorageClient>,
	collectionId: string,
	hash: string
): Promise<void> {
	const o = storageKeyFactory.createCollectionImageKey(collectionId, ImageSizeVariant.ORIGINAL, hash).get()
	const s = storageKeyFactory.createCollectionImageKey(collectionId, ImageSizeVariant.SMALL, hash).get()
	await Promise.all([storage.deleteFile(o), storage.deleteFile(s)])
}
