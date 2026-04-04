import { createHash } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { readMultipartFormData } from 'h3'
import { processImageToWebP } from '~~/lib/imageSharpProcessing'
import { assertAllowed, canAccessOwnUserRoles } from '~~/server/auth/permissions'
import { users } from '~~/server/db/schema'
import { useDb } from '~~/server/utils/db'
import { requireSessionUserRoles } from '~~/server/utils/sessionUserId'
import { useStorageClient } from '~~/server/utils/storage'

const AVATAR_MAX_PX = 512
const MAX_BYTES = 8 * 1024 * 1024

export default defineEventHandler(async (event) => {
	const { userId: sub, roles } = await requireSessionUserRoles(event)
	assertAllowed(canAccessOwnUserRoles(roles, 'updateSelf'))

	const parts = await readMultipartFormData(event)
	const file = parts?.find((p) => p.name === 'file' || p.name === 'avatar')
	if (file === undefined || file.data.length === 0) {
		throw createError({ statusCode: 400, statusMessage: 'Missing file' })
	}
	if (file.data.length > MAX_BYTES) {
		throw createError({ statusCode: 400, statusMessage: 'File too large' })
	}
	const mime = file.type ?? ''
	if (!mime.startsWith('image/')) {
		throw createError({ statusCode: 400, statusMessage: 'Not an image' })
	}

	let webp: Buffer
	try {
		webp = await processImageToWebP(file.data, AVATAR_MAX_PX, 0.88)
	} catch {
		throw createError({ statusCode: 400, statusMessage: 'Invalid or unsupported image' })
	}

	const hash = createHash('sha256').update(webp).digest('hex')
	const storage = useStorageClient()
	await storage.uploadUserAvatar(sub, hash, webp)
	const publicUrl = storage.getUserAvatarUrl(sub, hash).getPublicUrl()

	const db = useDb()
	await db.update(users).set({ image: publicUrl, updatedAt: new Date() }).where(eq(users.id, sub))

	return { ok: true as const, image: publicUrl }
})
