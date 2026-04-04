import { and, eq } from 'drizzle-orm'
import { assertAllowed, canCrudOwnResourceRoles } from '~~/server/auth/permissions'
import { collections, folders } from '~~/server/db/schema'
import { useDb } from '~~/server/utils/db'
import { requireSessionUserRoles } from '~~/server/utils/sessionUserId'

/**
 * Deletes the folder and moves its collections to “no folder” (`folder_id` null).
 * DB FK also uses ON DELETE SET NULL; we unparent explicitly first for a clear, auditable flow.
 */
export default defineEventHandler(async (event) => {
	const { userId: sub, roles } = await requireSessionUserRoles(event)
	assertAllowed(canCrudOwnResourceRoles(roles, 'folders', 'delete', sub, sub))

	const id = getRouterParam(event, 'id')
	if (typeof id !== 'string' || id === '') {
		throw createError({ statusCode: 400, statusMessage: 'Missing id' })
	}

	const db = useDb()

	let removed = false
	await db.transaction(async (tx) => {
		await tx
			.update(collections)
			.set({ folderId: null, updatedAt: new Date() })
			.where(and(eq(collections.folderId, id), eq(collections.userId, sub)))

		const rows = await tx
			.delete(folders)
			.where(and(eq(folders.id, id), eq(folders.userId, sub)))
			.returning({ id: folders.id })

		removed = rows.length > 0
	})

	if (!removed) {
		throw createError({ statusCode: 404, statusMessage: 'Not found' })
	}

	return { ok: true as const }
})
