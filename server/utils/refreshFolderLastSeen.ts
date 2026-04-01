import { and, eq, max } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import * as schema from '~~/server/db/schema'
import { collections, folders } from '~~/server/db/schema'

/** Sets folder `lastSeenAt` to MAX(member collections’ `lastSeenAt`), or null if none. */
export async function refreshFolderLastSeen(
	db: NodePgDatabase<typeof schema>,
	folderId: string,
	userId: string
): Promise<void> {
	const [agg] = await db
		.select({ m: max(collections.lastSeenAt) })
		.from(collections)
		.where(eq(collections.folderId, folderId))

	await db
		.update(folders)
		.set({
			lastSeenAt: agg?.m ?? null,
			updatedAt: new Date(),
		})
		.where(and(eq(folders.id, folderId), eq(folders.userId, userId)))
}
