import { and, asc, eq } from 'drizzle-orm'
import { mergeImageLayouts } from '~~/lib/collectionLayout/mergeImageLayout'
import { EnvironmentResolver } from '~~/lib/EnvironmentResolver'
import { assertAllowed, canCrudOwnResourceRoles } from '~~/server/auth/permissions'
import { boards, collections, images } from '~~/server/db/schema'
import { ImageSizeVariant } from '~~/server/storage/ImageSizeVariant'
import { StorageKeyFactory } from '~~/server/storage/key/StorageKeyFactory'
import { useDb } from '~~/server/utils/db'
import { requireSessionUserRoles } from '~~/server/utils/sessionUserId'

const storageKeyFactory = new StorageKeyFactory(new EnvironmentResolver())

export default defineEventHandler(async (event) => {
	const { userId: sub, roles } = await requireSessionUserRoles(event)
	assertAllowed(canCrudOwnResourceRoles(roles, 'collections', 'read', sub, sub))

	const boardId = getRouterParam(event, 'boardId')
	if (typeof boardId !== 'string' || boardId === '') {
		throw createError({ statusCode: 400, statusMessage: 'Missing id' })
	}

	const db = useDb()
	const [row] = await db
		.select({ board: boards, collection: collections })
		.from(boards)
		.innerJoin(collections, eq(boards.collectionId, collections.id))
		.where(and(eq(boards.id, boardId), eq(collections.userId, sub)))
		.limit(1)

	if (!row) {
		throw createError({ statusCode: 404, statusMessage: 'Not found' })
	}

	const { board } = row

	await db.update(collections).set({ currentBoardId: board.id }).where(eq(collections.id, board.collectionId))

	const imageRows = await db
		.select()
		.from(images)
		.where(eq(images.boardId, boardId))
		.orderBy(asc(images.zIndex), asc(images.id))

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

	const hasViewport =
		board.viewportCenterX !== null && board.viewportCenterY !== null && board.viewportZoom !== null

	return {
		board: {
			id: board.id,
			collectionId: board.collectionId,
			name: board.name,
			viewportCenter: hasViewport ? { x: board.viewportCenterX!, y: board.viewportCenterY! } : null,
			viewportZoom: hasViewport ? board.viewportZoom! : null,
			images: imageRows.map((img) => {
				const layout = layoutById.get(img.id)
				if (layout === undefined) {
					throw new Error(`layout missing for image ${img.id}`)
				}
				return {
					id: img.id,
					url: storageKeyFactory
						.createCollectionImageKey(board.collectionId, ImageSizeVariant.ORIGINAL, img.hash)
						.getPublicUrl(),
					sourceUrl: img.sourceUrl,
					width: img.width,
					height: img.height,
					layout: {
						...layout,
						flipX: img.layoutFlipX,
						flipY: img.layoutFlipY,
						zIndex: img.zIndex,
					},
				}
			}),
		},
	}
})
