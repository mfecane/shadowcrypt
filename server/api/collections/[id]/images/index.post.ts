import { and, desc, eq } from 'drizzle-orm'
import { readMultipartFormData } from 'h3'
import { randomUUID } from 'node:crypto'
import { Buffer } from 'node:buffer'
import { mergeImageLayouts } from '~~/lib/collectionLayout/mergeImageLayout'
import { MAX_COLLECTION_IMAGE_UPLOAD_BYTES } from '~~/lib/config/image'
import { EnvironmentResolver } from '~~/lib/EnvironmentResolver'
import { getCollectionImageStoredDimensions } from '~~/lib/imageSharpProcessing'
import { assertAllowed, canCreateResourceRoles } from '~~/server/auth/permissions'
import { collections, images } from '~~/server/db/schema'
import { ImageSizeVariant } from '~~/server/storage/ImageSizeVariant'
import { StorageKeyFactory } from '~~/server/storage/key/StorageKeyFactory'
import { useDb } from '~~/server/utils/db'
import { requireSessionUserRoles } from '~~/server/utils/sessionUserId'
import { useStorageClient } from '~~/server/utils/storage'

const storageKeyFactory = new StorageKeyFactory(new EnvironmentResolver())

function isHttpUrl(value: string): boolean {
	try {
		const url = new URL(value)
		return url.protocol === 'http:' || url.protocol === 'https:'
	} catch {
		return false
	}
}

export default defineEventHandler(async (event) => {
	const { userId: sub, roles } = await requireSessionUserRoles(event)
	assertAllowed(canCreateResourceRoles(roles, 'images'))

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
	const source = await readUploadSource(parts)

	let dims: { width: number; height: number }
	try {
		dims = await getCollectionImageStoredDimensions(source.data)
	} catch {
		throw createError({ statusCode: 400, statusMessage: 'Invalid or unsupported image' })
	}

	const hash = randomUUID()
	const storage = useStorageClient()
	let uploaded = false

	try {
		await storage.uploadCollectionImage(collectionId, hash, source.data)
		uploaded = true
		const [topImage] = await db
			.select({ zIndex: images.zIndex })
			.from(images)
			.where(eq(images.collectionId, collectionId))
			.orderBy(desc(images.zIndex))
			.limit(1)
		const nextZIndex = (topImage?.zIndex ?? -1) + 1

		const [inserted] = await db
			.insert(images)
			.values({
				collectionId,
				userId: sub,
				hash,
				width: dims.width,
				height: dims.height,
				zIndex: nextZIndex,
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
					zIndex: nextZIndex,
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

async function readUploadSource(
	parts: Awaited<ReturnType<typeof readMultipartFormData>>
): Promise<{ data: Buffer; mime: string | null }> {
	const file = parts?.find((p) => p.name === 'file')
	if (file !== undefined && file.data.length > 0) {
		if (file.data.length > MAX_COLLECTION_IMAGE_UPLOAD_BYTES) {
			throw createError({ statusCode: 400, statusMessage: 'File too large' })
		}
		const mime = file.type ?? ''
		if (!mime.startsWith('image/')) {
			throw createError({ statusCode: 400, statusMessage: 'Not an image' })
		}
		return { data: file.data, mime }
	}

	const urlPart = parts?.find((p) => p.name === 'url')
	const imageUrl = urlPart?.data.toString('utf8').trim() ?? ''
	if (imageUrl.length === 0) {
		throw createError({ statusCode: 400, statusMessage: 'Missing file or URL' })
	}
	if (!isHttpUrl(imageUrl)) {
		throw createError({ statusCode: 400, statusMessage: 'Invalid image URL' })
	}

	let response: Response
	try {
		response = await fetch(imageUrl)
	} catch {
		throw createError({ statusCode: 400, statusMessage: 'Could not fetch image URL' })
	}
	if (!response.ok) {
		throw createError({ statusCode: 400, statusMessage: 'Could not fetch image URL' })
	}

	const mime = response.headers.get('content-type')?.split(';')[0]?.trim() ?? null
	if (mime !== null && mime !== '' && !mime.startsWith('image/')) {
		throw createError({ statusCode: 400, statusMessage: 'URL does not point to an image' })
	}

	const arrayBuffer = await response.arrayBuffer()
	const data = Buffer.from(arrayBuffer)
	if (data.length === 0) {
		throw createError({ statusCode: 400, statusMessage: 'Fetched image is empty' })
	}
	if (data.length > MAX_COLLECTION_IMAGE_UPLOAD_BYTES) {
		throw createError({ statusCode: 400, statusMessage: 'Fetched image is too large' })
	}

	return { data, mime }
}

async function deleteCollectionImageObjects(
	storage: ReturnType<typeof useStorageClient>,
	collectionId: string,
	hash: string
): Promise<void> {
	const o = storageKeyFactory.createCollectionImageKey(collectionId, ImageSizeVariant.ORIGINAL, hash).get()
	const s = storageKeyFactory.createCollectionImageKey(collectionId, ImageSizeVariant.SMALL, hash).get()
	await Promise.all([storage.deleteFile(o), storage.deleteFile(s)])
}
