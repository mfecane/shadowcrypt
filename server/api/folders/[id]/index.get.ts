import { and, eq } from 'drizzle-orm'
import { EnvironmentResolver } from '~~/lib/EnvironmentResolver'
import { collections, folders } from '~~/server/db/schema'
import { StorageKeyFactory } from '~~/server/storage/key/StorageKeyFactory'
import { buildCollectionListItemMap } from '~~/server/utils/collectionListItems'
import { useDb } from '~~/server/utils/db'

const storageKeyFactory = new StorageKeyFactory(new EnvironmentResolver())

function compareByLastSeenThenUpdated<
	T extends { lastSeenAt: string | null; updatedAt: string },
>(a: T, b: T): number {
	const ta = a.lastSeenAt !== null ? Date.parse(a.lastSeenAt) : null
	const tb = b.lastSeenAt !== null ? Date.parse(b.lastSeenAt) : null
	if (ta !== null && tb !== null && tb !== ta) {
		return tb - ta
	}
	if (ta !== null && tb === null) {
		return -1
	}
	if (ta === null && tb !== null) {
		return 1
	}
	return Date.parse(b.updatedAt) - Date.parse(a.updatedAt)
}

export default defineEventHandler(async (event) => {
	const sub = await requireSessionUserId(event)

	const id = getRouterParam(event, 'id')
	if (typeof id !== 'string' || id === '') {
		throw createError({ statusCode: 400, statusMessage: 'Missing id' })
	}

	const db = useDb()
	const [folder] = await db
		.select()
		.from(folders)
		.where(and(eq(folders.id, id), eq(folders.userId, sub)))
		.limit(1)

	if (!folder) {
		throw createError({ statusCode: 404, statusMessage: 'Not found' })
	}

	const folderDto = {
		id: folder.id,
		name: folder.name,
		archived: folder.archived,
		lastSeenAt: folder.lastSeenAt?.toISOString() ?? null,
		updatedAt: folder.updatedAt.toISOString(),
	}

	if (folder.archived) {
		return {
			folder: folderDto,
			collections: [] as const,
			archivedCollections: [] as const,
		}
	}

	const folderCollections = await db
		.select()
		.from(collections)
		.where(and(eq(collections.folderId, id), eq(collections.userId, sub)))

	const folderById = new Map([[folder.id, { id: folder.id, name: folder.name }]])

	const byId = await buildCollectionListItemMap(db, folderCollections, folderById, storageKeyFactory)

	const active = folderCollections
		.filter((r) => !r.archived)
		.map((r) => byId.get(r.id)!)
		.sort(compareByLastSeenThenUpdated)

	const archivedCollections = folderCollections
		.filter((r) => r.archived)
		.map((r) => byId.get(r.id)!)
		.sort(compareByLastSeenThenUpdated)

	return {
		folder: folderDto,
		collections: active,
		archivedCollections,
	}
})
