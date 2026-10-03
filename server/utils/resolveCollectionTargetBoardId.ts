import { asc, eq } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import * as schema from '~~/server/db/schema'
import { boards, collections } from '~~/server/db/schema'

/** Collection's current board, or its oldest board when none was opened yet. */
export async function resolveCollectionTargetBoardId(
	db: NodePgDatabase<typeof schema>,
	collectionId: string
): Promise<string> {
	const [col] = await db
		.select({ currentBoardId: collections.currentBoardId })
		.from(collections)
		.where(eq(collections.id, collectionId))
		.limit(1)
	if (col === undefined) {
		throw new Error(`collection ${collectionId} not found`)
	}
	if (col.currentBoardId !== null) {
		return col.currentBoardId
	}

	const [oldest] = await db
		.select({ id: boards.id })
		.from(boards)
		.where(eq(boards.collectionId, collectionId))
		.orderBy(asc(boards.createdAt))
		.limit(1)
	if (oldest === undefined) {
		throw new Error(`collection ${collectionId} has no boards`)
	}
	return oldest.id
}
