import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { collections, folders } from '~~/server/db/schema'
import { useDb } from '~~/server/utils/db'
import { refreshFolderLastSeen } from '~~/server/utils/refreshFolderLastSeen'

const patchBodySchema = z
	.object({
		name: z
			.string()
			.min(1)
			.max(256)
			.transform((s: string) => s.trim())
			.optional(),
		folderId: z.string().uuid().nullable().optional(),
		pinned: z.boolean().optional(),
		archived: z.boolean().optional(),
		viewportCenterX: z.number().finite().optional(),
		viewportCenterY: z.number().finite().optional(),
		viewportZoom: z.number().min(0.25).max(4).optional(),
	})
	.superRefine((data, ctx) => {
		const hasName = data.name !== undefined
		const hasFolder = data.folderId !== undefined
		const hasPinned = data.pinned !== undefined
		const hasArchived = data.archived !== undefined
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
		if (!hasName && !hasFullViewport && !hasFolder && !hasPinned && !hasArchived) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message:
					'Provide name, folderId, pinned, archived, and/or a full viewport (center x, center y, zoom)',
			})
		}
	})

export default defineEventHandler(async (event) => {
	const sub = await requireSessionUserId(event)

	const id = getRouterParam(event, 'id')
	if (typeof id !== 'string' || id === '') {
		throw createError({ statusCode: 400, statusMessage: 'Missing id' })
	}

	const parsed = patchBodySchema.parse(await readBody(event))
	const db = useDb()

	const [col] = await db
		.select()
		.from(collections)
		.where(and(eq(collections.id, id), eq(collections.userId, sub)))
		.limit(1)

	if (!col) {
		throw createError({ statusCode: 404, statusMessage: 'Not found' })
	}

	if (parsed.folderId !== undefined && parsed.folderId !== null) {
		const [f] = await db
			.select()
			.from(folders)
			.where(and(eq(folders.id, parsed.folderId), eq(folders.userId, sub)))
			.limit(1)
		if (!f) {
			throw createError({ statusCode: 400, statusMessage: 'Folder not found' })
		}
		if (f.archived) {
			throw createError({ statusCode: 400, statusMessage: 'Folder is archived' })
		}
	}

	const hasViewport =
		parsed.viewportCenterX !== undefined &&
		parsed.viewportCenterY !== undefined &&
		parsed.viewportZoom !== undefined

	const oldFolderId = col.folderId

	const nextArchived = parsed.archived !== undefined ? parsed.archived : col.archived
	const nextPinned =
		parsed.archived === true ? false : parsed.pinned !== undefined ? parsed.pinned : col.pinned

	await db
		.update(collections)
		.set({
			...(parsed.name !== undefined ? { name: parsed.name } : {}),
			...(parsed.folderId !== undefined ? { folderId: parsed.folderId } : {}),
			...(parsed.pinned !== undefined || parsed.archived !== undefined
				? {
						pinned: nextPinned,
						archived: nextArchived,
					}
				: {}),
			...(hasViewport
				? {
						viewportCenterX: parsed.viewportCenterX,
						viewportCenterY: parsed.viewportCenterY,
						viewportZoom: parsed.viewportZoom,
					}
				: {}),
			updatedAt: new Date(),
		})
		.where(eq(collections.id, id))

	const newFolderId = parsed.folderId !== undefined ? parsed.folderId : oldFolderId

	if (oldFolderId !== null && oldFolderId !== newFolderId) {
		await refreshFolderLastSeen(db, oldFolderId, sub)
	}
	if (newFolderId !== null && newFolderId !== oldFolderId) {
		await refreshFolderLastSeen(db, newFolderId, sub)
	}

	return { ok: true }
})
