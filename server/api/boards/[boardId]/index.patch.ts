import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { assertAllowed, canCrudOwnResourceRoles } from '~~/server/auth/permissions'
import { boards, collections } from '~~/server/db/schema'
import { useDb } from '~~/server/utils/db'
import { requireSessionUserRoles } from '~~/server/utils/sessionUserId'

const patchBodySchema = z
	.object({
		name: z
			.string()
			.min(1)
			.max(256)
			.transform((s: string) => s.trim())
			.optional(),
		viewportCenterX: z.number().finite().optional(),
		viewportCenterY: z.number().finite().optional(),
		viewportZoom: z.number().min(0.25).max(4).optional(),
	})
	.superRefine((data, ctx) => {
		const vx = data.viewportCenterX
		const vy = data.viewportCenterY
		const vz = data.viewportZoom
		const hasAnyViewport = vx !== undefined || vy !== undefined || vz !== undefined
		const hasFullViewport = vx !== undefined && vy !== undefined && vz !== undefined
		if (hasAnyViewport && !hasFullViewport) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'viewportCenterX, viewportCenterY, and viewportZoom must be sent together',
			})
		}
		if (data.name === undefined && !hasFullViewport) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'Provide name and/or a full viewport (center x, center y, zoom)',
			})
		}
	})

export default defineEventHandler(async (event) => {
	const { userId: sub, roles } = await requireSessionUserRoles(event)
	assertAllowed(canCrudOwnResourceRoles(roles, 'collections', 'update', sub, sub))

	const boardId = getRouterParam(event, 'boardId')
	if (typeof boardId !== 'string' || boardId === '') {
		throw createError({ statusCode: 400, statusMessage: 'Missing id' })
	}

	const parsed = patchBodySchema.parse(await readBody(event))
	const db = useDb()

	const [row] = await db
		.select({ board: boards })
		.from(boards)
		.innerJoin(collections, eq(boards.collectionId, collections.id))
		.where(and(eq(boards.id, boardId), eq(collections.userId, sub)))
		.limit(1)

	if (!row) {
		throw createError({ statusCode: 404, statusMessage: 'Not found' })
	}

	const hasViewport =
		parsed.viewportCenterX !== undefined &&
		parsed.viewportCenterY !== undefined &&
		parsed.viewportZoom !== undefined

	await db
		.update(boards)
		.set({
			...(parsed.name !== undefined ? { name: parsed.name } : {}),
			...(hasViewport
				? {
						viewportCenterX: parsed.viewportCenterX,
						viewportCenterY: parsed.viewportCenterY,
						viewportZoom: parsed.viewportZoom,
					}
				: {}),
			updatedAt: new Date(),
		})
		.where(eq(boards.id, boardId))

	return { ok: true }
})
