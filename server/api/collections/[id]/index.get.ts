import { and, asc, eq, inArray } from 'drizzle-orm'
import { EnvironmentResolver } from '~~/lib/EnvironmentResolver'
import { assertAllowed, canCrudOwnResourceRoles } from '~~/server/auth/permissions'
import { boards, collections, images } from '~~/server/db/schema'
import { ImageSizeVariant } from '~~/server/storage/ImageSizeVariant'
import { StorageKeyFactory } from '~~/server/storage/key/StorageKeyFactory'
import { useDb } from '~~/server/utils/db'
import { requireSessionUserRoles } from '~~/server/utils/sessionUserId'
import { refreshFolderLastSeen } from '~~/server/utils/refreshFolderLastSeen'

const PREVIEW_IMAGES_PER_BOARD = 6

const storageKeyFactory = new StorageKeyFactory(new EnvironmentResolver())

export default defineEventHandler(async (event) => {
	const { userId: sub, roles } = await requireSessionUserRoles(event)
	assertAllowed(canCrudOwnResourceRoles(roles, 'collections', 'read', sub, sub))

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

	const boardRows = await db
		.select()
		.from(boards)
		.where(eq(boards.collectionId, id))
		.orderBy(asc(boards.createdAt))
	const boardIds = boardRows.map((b) => b.id)
	const imageRows =
		boardIds.length > 0
			? await db
					.select({ boardId: images.boardId, hash: images.hash, width: images.width, height: images.height })
					.from(images)
					.where(inArray(images.boardId, boardIds))
					.orderBy(asc(images.zIndex), asc(images.id))
			: []

	const imageCountByBoard = new Map<string, number>()
	const previewImagesByBoard = new Map<string, { url: string; width: number | null; height: number | null }[]>()
	for (const row of imageRows) {
		imageCountByBoard.set(row.boardId, (imageCountByBoard.get(row.boardId) ?? 0) + 1)

		const previews = previewImagesByBoard.get(row.boardId) ?? []
		if (previews.length < PREVIEW_IMAGES_PER_BOARD) {
			previews.push({
				url: storageKeyFactory.createCollectionImageKey(id, ImageSizeVariant.SMALL, row.hash).getPublicUrl(),
				width: row.width,
				height: row.height,
			})
			previewImagesByBoard.set(row.boardId, previews)
		}
	}

	return {
		collection: {
			id: col.id,
			name: col.name,
			pinned: col.pinned,
			archived: col.archived,
			folderId: col.folderId,
			lastSeenAt: seenAt.toISOString(),
			currentBoardId: col.currentBoardId,
			updatedAt: col.updatedAt.toISOString(),
			boards: boardRows
				.map((b) => ({
					id: b.id,
					name: b.name,
					imageCount: imageCountByBoard.get(b.id) ?? 0,
					updatedAt: b.updatedAt.toISOString(),
					previewImages: previewImagesByBoard.get(b.id) ?? [],
				})),
		},
	}
})
