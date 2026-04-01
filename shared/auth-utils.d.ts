declare module '#auth-utils' {
	interface User {
		id: string
		email: string
		name: string | null
		/** DB value: S3 content hash, external URL (OAuth / legacy), or null when no photo */
		avatarRef: string | null
		hasCustomAvatar: boolean
		roles: ('client' | 'artist' | 'admin' | 'moderator')[]
		isAdmin: boolean
	}
}

export {}
