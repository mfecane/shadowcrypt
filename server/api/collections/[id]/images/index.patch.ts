import { and, eq, inArray } from 'drizzle-orm'
import { z } from 'zod'
import { assertAllowed, canCrudOwnResourceRoles } from '~~/server/auth/permissions'
import { collections, images } from '~~/server/db/schema'
import { useDb } from '~~/server/utils/db'
import { requireSessionUserRoles } from '~~/server/utils/sessionUserId'

const layoutSchema = z.object({
	imageId: z.string().uuid(),
	layoutX: z.number().finite(),
	layoutY: z.number().finite(),
	layoutW: z.number().finite().positive(),
	layoutH: z.number().finite().positive(),
	layoutZ: z.number().int().nonnegative(),
	layoutFlipX: z.boolean().optional().default(false),
	layoutFlipY: z.boolean().optional().default(false),
})

const bodySchema = z.object({
	images: z.array(layoutSchema).max(5_000),
})

export default defineEventHandler(async (event) => {
	const { userId: sub, roles } = await requireSessionUserRoles(event)
	assertAllowed(canCrudOwnResourceRoles(roles, 'images', 'update', sub, sub))

	const collectionId = getRouterParam(event, 'id')
	if (typeof collectionId !== 'string' || collectionId === '') {
		throw createError({ statusCode: 400, statusMessage: 'Bad request' })
	}

	const parsed = bodySchema.parse(await readBody(event))
	if (parsed.images.length === 0) {
		return { ok: true, updated: 0 }
	}

	const byImageId = new Map<string, (typeof parsed.images)[number]>()
	for (const row of parsed.images) {
		if (byImageId.has(row.imageId)) {
			throw createError({ statusCode: 400, statusMessage: 'Duplicate imageId in batch' })
		}
		byImageId.set(row.imageId, row)
	}

	const db = useDb()
	const [col] = await db
		.select({ id: collections.id })
		.from(collections)
		.where(and(eq(collections.id, collectionId), eq(collections.userId, sub)))
		.limit(1)
	if (!col) {
		throw createError({ statusCode: 404, statusMessage: 'Not found' })
	}

	const requestedImageIds = [...byImageId.keys()]
	const ownedImages = await db
		.select({ id: images.id })
		.from(images)
		.where(and(eq(images.collectionId, collectionId), inArray(images.id, requestedImageIds)))

	if (ownedImages.length !== requestedImageIds.length) {
		throw createError({ statusCode: 404, statusMessage: 'Not found' })
	}

	const now = new Date()
	await db.transaction(async (tx) => {
		for (const imageId of requestedImageIds) {
			const row = byImageId.get(imageId)!
			await tx
				.update(images)
				.set({
					layoutX: row.layoutX,
					layoutY: row.layoutY,
					layoutW: row.layoutW,
					layoutH: row.layoutH,
					layoutFlipX: row.layoutFlipX,
					layoutFlipY: row.layoutFlipY,
					zIndex: row.layoutZ,
					updatedAt: now,
				})
				.where(and(eq(images.id, imageId), eq(images.collectionId, collectionId)))
		}
	})

	return { ok: true, updated: requestedImageIds.length }
})
