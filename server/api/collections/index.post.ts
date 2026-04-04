import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { assertAllowed, canCreateResourceRoles } from '~~/server/auth/permissions'
import { collections, folders } from '~~/server/db/schema'
import { refreshFolderLastSeen } from '~~/server/utils/refreshFolderLastSeen'
import { useDb } from '~~/server/utils/db'
import { requireSessionUserRoles } from '~~/server/utils/sessionUserId'

const bodySchema = z.object({
	name: z
		.string()
		.min(1)
		.max(256)
		.transform((s: string) => s.trim()),
	folderId: z.string().uuid().nullable().optional(),
})

export default defineEventHandler(async (event) => {
	const { userId: sub, roles } = await requireSessionUserRoles(event)
	assertAllowed(canCreateResourceRoles(roles, 'collections'))
	const parsed = bodySchema.parse(await readBody(event))
	const db = useDb()

	let resolvedFolderId: string | null = null
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
		resolvedFolderId = f.id
	}

	const now = new Date()
	const [row] = await db
		.insert(collections)
		.values({
			userId: sub,
			name: parsed.name,
			folderId: resolvedFolderId,
			updatedAt: now,
		})
		.returning()

	if (row === undefined) {
		throw createError({ statusCode: 500, statusMessage: 'Insert failed' })
	}

	if (resolvedFolderId !== null) {
		await refreshFolderLastSeen(db, resolvedFolderId, sub)
	}

	return {
		collection: {
			id: row.id,
			name: row.name,
			folderId: row.folderId,
			pinned: row.pinned,
			archived: row.archived,
			lastSeenAt: row.lastSeenAt?.toISOString() ?? null,
			updatedAt: row.updatedAt.toISOString(),
		},
	}
})
