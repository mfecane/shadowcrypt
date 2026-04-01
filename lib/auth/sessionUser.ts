import type { InferSelectModel } from 'drizzle-orm'
import type { User } from '#auth-utils'
import { users } from '~~/server/db/schema'

export type UserRow = InferSelectModel<typeof users>

export function sessionUserFromRow(row: UserRow): User {
	const hasCustomAvatar = row.image !== null
	const roles = row.roles
	const isAdmin = roles.includes('admin')
	return {
		id: row.id,
		email: row.email,
		name: row.name,
		avatarRef: row.image,
		hasCustomAvatar,
		roles,
		isAdmin,
	}
}
