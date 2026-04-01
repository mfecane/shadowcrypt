import { inArray } from 'drizzle-orm'
import type { CollectionListItem } from '~/types/collections'
import { collections, images } from '~~/server/db/schema'
import { ImageSizeVariant } from '~~/server/storage/ImageSizeVariant'
import type { StorageKeyFactory } from '~~/server/storage/key/StorageKeyFactory'
import type { useDb } from '~~/server/utils/db'

type Db = ReturnType<typeof useDb>

/**
 * Builds list API items (preview images, counts) for the given collection rows.
 */
export async function buildCollectionListItemMap(
	db: Db,
	collectionRows: (typeof collections.$inferSelect)[],
	folderById: Map<string, { id: string; name: string }>,
	storageKeyFactory: StorageKeyFactory
): Promise<Map<string, CollectionListItem>> {
	const out = new Map<string, CollectionListItem>()
	if (collectionRows.length === 0) {
		return out
	}

	const collectionIds = collectionRows.map((r) => r.id)
	const imageRows = await db
		.select()
		.from(images)
		.where(inArray(images.collectionId, collectionIds))

	const countByCollection = new Map<string, number>()
	const byCollection = new Map<string, typeof imageRows>()
	for (const img of imageRows) {
		countByCollection.set(img.collectionId, (countByCollection.get(img.collectionId) ?? 0) + 1)
		const list = byCollection.get(img.collectionId) ?? []
		list.push(img)
		byCollection.set(img.collectionId, list)
	}

	for (const [cid, list] of byCollection) {
		list.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
		byCollection.set(cid, list.slice(0, 5))
	}

	for (const col of collectionRows) {
		const imgs = byCollection.get(col.id) ?? []
		const item: CollectionListItem = {
			id: col.id,
			name: col.name,
			pinned: col.pinned,
			archived: col.archived,
			folderId: col.folderId,
			folder: col.folderId !== null ? (folderById.get(col.folderId) ?? null) : null,
			lastSeenAt: col.lastSeenAt?.toISOString() ?? null,
			updatedAt: col.updatedAt.toISOString(),
			imageCount: countByCollection.get(col.id) ?? 0,
			images: imgs.map((img) => ({
				id: img.id,
				url: storageKeyFactory
					.createCollectionImageKey(col.id, ImageSizeVariant.SMALL, img.hash)
					.getPublicUrl(),
				width: img.width,
				height: img.height,
			})),
		}
		out.set(col.id, item)
	}

	return out
}
