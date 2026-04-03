import { and, desc, eq } from 'drizzle-orm'
import { mergeImageLayouts } from '~~/lib/collectionLayout/mergeImageLayout'
import { EnvironmentResolver } from '~~/lib/EnvironmentResolver'
import { collections, images } from '~~/server/db/schema'
import { ImageSizeVariant } from '~~/server/storage/ImageSizeVariant'
import { StorageKeyFactory } from '~~/server/storage/key/StorageKeyFactory'
import { useDb } from '~~/server/utils/db'
import { refreshFolderLastSeen } from '~~/server/utils/refreshFolderLastSeen'

const storageKeyFactory = new StorageKeyFactory(new EnvironmentResolver())

export default defineEventHandler(async (event) => {
	const sub = await requireSessionUserId(event)

	const id = getRouterParam(event, 'id')
	if (typeof id !== 'string' || id === '') {
		throw createError({ statusCode: 400, statusMessage: 'Missing id' })
	}

	const db = useDb()
	const [col] = await db
		.select()
		.from(collections)
		.where(and(eq(collections.id, id), eq(collections.userId, sub)))
		.limit(1)

	if (!col) {
		throw createError({ statusCode: 404, statusMessage: 'Not found' })
	}

	const seenAt = new Date()
	await db
		.update(collections)
		.set({ lastSeenAt: seenAt })
		.where(and(eq(collections.id, id), eq(collections.userId, sub)))

	if (col.folderId !== null) {
		await refreshFolderLastSeen(db, col.folderId, sub)
	}

	const imageRows = await db.select().from(images).where(eq(images.collectionId, id)).orderBy(desc(images.updatedAt))

	const layoutById = mergeImageLayouts(
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

	const hasViewport = col.viewportCenterX !== null && col.viewportCenterY !== null && col.viewportZoom !== null

	return {
		collection: {
			id: col.id,
			name: col.name,
			pinned: col.pinned,
			archived: col.archived,
			folderId: col.folderId,
			lastSeenAt: seenAt.toISOString(),
			updatedAt: col.updatedAt.toISOString(),
			viewportCenter: hasViewport ? { x: col.viewportCenterX!, y: col.viewportCenterY! } : null,
			viewportZoom: hasViewport ? col.viewportZoom! : null,
			images: imageRows.map((img) => {
				const layout = layoutById.get(img.id)
				if (layout === undefined) {
					throw new Error(`layout missing for image ${img.id}`)
				}
				return {
					id: img.id,
					url: storageKeyFactory
						.createCollectionImageKey(col.id, ImageSizeVariant.ORIGINAL, img.hash)
						.getPublicUrl(),
					width: img.width,
					height: img.height,
					layout,
				}
			}),
		},
	}
})
