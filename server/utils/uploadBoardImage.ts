import type { H3Event } from 'h3'
import { readMultipartFormData } from 'h3'
import { randomUUID } from 'node:crypto'
import { Buffer } from 'node:buffer'
import { desc, eq } from 'drizzle-orm'
import { mergeImageLayouts } from '~~/lib/collectionLayout/mergeImageLayout'
import { COLLECTION_IMAGE_UPLOAD } from '~~/lib/config/image'
import { EnvironmentResolver } from '~~/lib/EnvironmentResolver'
import { getCollectionImageStoredDimensions } from '~~/lib/imageSharpProcessing'
import { images } from '~~/server/db/schema'
import { ImageSizeVariant } from '~~/server/storage/ImageSizeVariant'
import { StorageKeyFactory } from '~~/server/storage/key/StorageKeyFactory'
import { useDb } from '~~/server/utils/db'
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

interface UploadSource {
	data: Buffer
	mime: string | null
}

type MultipartParts = Awaited<ReturnType<typeof readMultipartFormData>>

/** Board world point (image center) chosen by the client; null when not provided. */
function readWorldPoint(parts: MultipartParts): { x: number; y: number } | null {
	const xPart = parts?.find((p) => p.name === 'worldX')
	const yPart = parts?.find((p) => p.name === 'worldY')
	if (xPart === undefined || yPart === undefined) {
		return null
	}
	const x = Number.parseFloat(xPart.data.toString('utf8'))
	const y = Number.parseFloat(yPart.data.toString('utf8'))
	if (!Number.isFinite(x) || !Number.isFinite(y)) {
		throw createError({ statusCode: 400, statusMessage: 'Invalid world point' })
	}
	return { x, y }
}

async function readUploadSource(parts: MultipartParts): Promise<UploadSource> {
	const file = parts?.find((p) => p.name === 'file')
	if (file !== undefined && file.data.length > 0) {
		if (file.data.length > COLLECTION_IMAGE_UPLOAD.MAX_BYTES) {
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
	if (data.length > COLLECTION_IMAGE_UPLOAD.MAX_BYTES) {
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

/** Uploads the multipart/file-or-url body of `event` as a new image on `boardId` (storage keyed by `collectionId`). */
export async function uploadBoardImage(event: H3Event, boardId: string, collectionId: string, userId: string) {
	const db = useDb()
	const parts = await readMultipartFormData(event)
	const source = await readUploadSource(parts)
	const worldPoint = readWorldPoint(parts)

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
			.where(eq(images.boardId, boardId))
			.orderBy(desc(images.zIndex))
			.limit(1)
		const nextZIndex = (topImage?.zIndex ?? -1) + 1

		const [inserted] = await db
			.insert(images)
			.values({
				boardId,
				userId,
				hash,
				width: dims.width,
				height: dims.height,
				zIndex: nextZIndex,
			})
			.returning()

		if (inserted === undefined) {
			throw createError({ statusCode: 500, statusMessage: 'Upload failed' })
		}

		const imageRows = await db.select().from(images).where(eq(images.boardId, boardId))

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

		let layout = layouts.get(inserted.id)
		if (layout === undefined) {
			await db.delete(images).where(eq(images.id, inserted.id))
			throw createError({ statusCode: 500, statusMessage: 'Upload failed' })
		}

		if (worldPoint !== null) {
			layout = {
				...layout,
				x: worldPoint.x - layout.w / 2,
				y: worldPoint.y - layout.h / 2,
			}
		}

		await db
			.update(images)
			.set({
				layoutX: layout.x,
				layoutY: layout.y,
				layoutW: layout.w,
				layoutH: layout.h,
				layoutFlipX: false,
				layoutFlipY: false,
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
					flipX: false,
					flipY: false,
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
}
