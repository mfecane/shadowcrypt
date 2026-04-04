import type { UserRole } from '~~/server/db/schema'

interface CrudPermission {
	create: boolean
	read: boolean
	update: boolean
	delete: boolean
}

interface PermissionsRecord {
	user: {
		readSelf: boolean
		updateSelf: boolean
	}

	folders: CrudPermission
	collections: CrudPermission
	images: CrudPermission
}

type Resource = 'folders' | 'collections' | 'images'
type CrudAction = keyof CrudPermission

const full: CrudPermission = {
	create: true,
	read: true,
	update: true,
	delete: true,
}

const permissions: Record<UserRole, PermissionsRecord> = {
	demo: {
		user: {
			readSelf: true,
			updateSelf: false,
		},
		folders: { create: false, read: true, update: false, delete: false },
		collections: { create: false, read: true, update: false, delete: false },
		images: { create: false, read: true, update: false, delete: false },
	},

	user: {
		user: {
			readSelf: true,
			updateSelf: true,
		},
		folders: full,
		collections: full,
		images: full,
	},

	moderator: {
		user: {
			readSelf: true,
			updateSelf: false,
		},
		folders: full,
		collections: full,
		images: full,
	},

	admin: {
		user: {
			readSelf: true,
			updateSelf: true,
		},
		folders: full,
		collections: full,
		images: full,
	},
}

function hasCrudPermission(role: UserRole, resource: Resource, action: CrudAction): boolean {
	return permissions[role][resource][action]
}

function canAccessOwnUser(role: UserRole, action: 'readSelf' | 'updateSelf'): boolean {
	return permissions[role].user[action]
}

function isElevatedRole(role: UserRole): boolean {
	return role === 'admin' || role === 'moderator'
}

function isOwner(ownerId: string, currentUserId: string): boolean {
	return ownerId === currentUserId
}

function canCrudOwnResource(
	role: UserRole,
	resource: Resource,
	action: CrudAction,
	ownerId: string,
	currentUserId: string
): boolean {
	if (!hasCrudPermission(role, resource, action)) return false
	if (isElevatedRole(role)) return true
	return isOwner(ownerId, currentUserId)
}

export function canCrudOwnResourceRoles(
	roles: UserRole[],
	resource: Resource,
	action: CrudAction,
	ownerId: string,
	currentUserId: string
): boolean {
	return roles.some((r) => canCrudOwnResource(r, resource, action, ownerId, currentUserId))
}

export function canCreateResourceRoles(roles: UserRole[], resource: Resource): boolean {
	return roles.some((r) => hasCrudPermission(r, resource, 'create'))
}

export function canAccessOwnUserRoles(roles: UserRole[], action: 'readSelf' | 'updateSelf'): boolean {
	return roles.some((r) => canAccessOwnUser(r, action))
}

export function assertAllowed(condition: boolean, message = 'Forbidden'): void {
	if (!condition) {
		throw createError({
			statusCode: 403,
			statusMessage: message,
		})
	}
}
