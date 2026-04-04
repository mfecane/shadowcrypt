import { eq } from 'drizzle-orm'
import { EnvironmentResolver } from '~~/lib/EnvironmentResolver'
import { assertAllowed, canCrudOwnResourceRoles } from '~~/server/auth/permissions'
import { collections, folders } from '~~/server/db/schema'
import { StorageKeyFactory } from '~~/server/storage/key/StorageKeyFactory'
import { buildCollectionListItemMap } from '~~/server/utils/collectionListItems'
import { useDb } from '~~/server/utils/db'
import { requireSessionUserRoles } from '~~/server/utils/sessionUserId'

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

function compareFoldersByLastSeen<
	T extends { lastSeenAt: string | null; updatedAt: string; name: string },
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
	const ua = Date.parse(a.updatedAt)
	const ub = Date.parse(b.updatedAt)
	if (ub !== ua) {
		return ub - ua
	}
	return a.name.localeCompare(b.name)
}

export default defineEventHandler(async (event) => {
	const { userId: sub, roles } = await requireSessionUserRoles(event)
	assertAllowed(canCrudOwnResourceRoles(roles, 'collections', 'read', sub, sub))

	const db = useDb()
	const folderMetaRows = await db.select().from(folders).where(eq(folders.userId, sub))

	const rows = await db.select().from(collections).where(eq(collections.userId, sub))

	const folderById = new Map(folderMetaRows.map((f) => [f.id, { id: f.id, name: f.name }]))

	const byId =
		rows.length > 0
			? await buildCollectionListItemMap(db, rows, folderById, storageKeyFactory)
			: new Map()

	const folderRowById = new Map(folderMetaRows.map((f) => [f.id, f]))

	const folderMetaSorted = [...folderMetaRows].sort((a, b) =>
		compareFoldersByLastSeen(
			{
				lastSeenAt: a.lastSeenAt?.toISOString() ?? null,
				updatedAt: a.updatedAt.toISOString(),
				name: a.name,
			},
			{
				lastSeenAt: b.lastSeenAt?.toISOString() ?? null,
				updatedAt: b.updatedAt.toISOString(),
				name: b.name,
			}
		)
	)

	const activeFoldersSorted = folderMetaSorted.filter((f) => !f.archived)
	const archivedFoldersSorted = folderMetaSorted.filter((f) => f.archived)

	const pinned = [...byId.values()]
		.filter((c) => {
			if (!c.pinned || c.archived) {
				return false
			}
			if (c.folderId === null) {
				return true
			}
			const f = folderRowById.get(c.folderId)
			return f !== undefined && !f.archived
		})
		.sort(compareByLastSeenThenUpdated)

	const ungrouped = [...byId.values()]
		.filter((c) => c.folderId === null && !c.archived)
		.sort(compareByLastSeenThenUpdated)

	const archivedUngrouped = [...byId.values()]
		.filter((c) => c.folderId === null && c.archived)
		.sort(compareByLastSeenThenUpdated)

	const foldersOut = activeFoldersSorted.map((f) => {
		const inFolder = rows.filter((r) => r.folderId === f.id)
		const activeCollections = inFolder
			.filter((r) => !r.archived)
			.map((r) => byId.get(r.id)!)
			.sort(compareByLastSeenThenUpdated)
		const archivedCollections = inFolder
			.filter((r) => r.archived)
			.map((r) => byId.get(r.id)!)
			.sort(compareByLastSeenThenUpdated)
		return {
			id: f.id,
			name: f.name,
			lastSeenAt: f.lastSeenAt?.toISOString() ?? null,
			updatedAt: f.updatedAt.toISOString(),
			collections: activeCollections,
			archivedCollections,
		}
	})

	const archivedFolders = archivedFoldersSorted.map((f) => ({
		id: f.id,
		name: f.name,
		lastSeenAt: f.lastSeenAt?.toISOString() ?? null,
		updatedAt: f.updatedAt.toISOString(),
	}))

	return {
		pinned,
		folders: foldersOut,
		ungrouped,
		archivedFolders,
		archivedUngrouped,
	}
})
