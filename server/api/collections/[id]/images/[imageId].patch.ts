import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { assertAllowed, canCrudOwnResourceRoles } from '~~/server/auth/permissions'
import { collections, images } from '~~/server/db/schema'
import { useDb } from '~~/server/utils/db'
import { requireSessionUserRoles } from '~~/server/utils/sessionUserId'

const layoutSchema = z.object({
	layoutX: z.number().finite(),
	layoutY: z.number().finite(),
	layoutW: z.number().finite().positive(),
	layoutH: z.number().finite().positive(),
	layoutZ: z.number().int().nonnegative(),
	layoutFlipX: z.boolean().optional().default(false),
	layoutFlipY: z.boolean().optional().default(false),
})

export default defineEventHandler(async (event) => {
	const { userId: sub, roles } = await requireSessionUserRoles(event)
	assertAllowed(canCrudOwnResourceRoles(roles, 'images', 'update', sub, sub))

	const collectionId = getRouterParam(event, 'id')
	const imageId = getRouterParam(event, 'imageId')
	if (
		typeof collectionId !== 'string' ||
		collectionId === '' ||
		typeof imageId !== 'string' ||
		imageId === ''
	) {
		throw createError({ statusCode: 400, statusMessage: 'Bad request' })
	}

	const parsed = layoutSchema.parse(await readBody(event))
	const db = useDb()

	const [col] = await db
		.select()
		.from(collections)
		.where(and(eq(collections.id, collectionId), eq(collections.userId, sub)))
		.limit(1)

	if (!col) {
		throw createError({ statusCode: 404, statusMessage: 'Not found' })
	}

	const [img] = await db
		.select()
		.from(images)
		.where(and(eq(images.id, imageId), eq(images.collectionId, collectionId)))
		.limit(1)

	if (!img) {
		throw createError({ statusCode: 404, statusMessage: 'Not found' })
	}

	await db
		.update(images)
		.set({
			layoutX: parsed.layoutX,
			layoutY: parsed.layoutY,
			layoutW: parsed.layoutW,
			layoutH: parsed.layoutH,
			layoutFlipX: parsed.layoutFlipX,
			layoutFlipY: parsed.layoutFlipY,
			zIndex: parsed.layoutZ,
			updatedAt: new Date(),
		})
		.where(eq(images.id, imageId))

	return { ok: true }
})
