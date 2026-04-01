declare module 'nuxt/schema' {
	interface RuntimeConfig {
		session?: {
			maxAge: number
			password: string
		}
		databaseUrl: string
		auth: {
			emailNoncePepper: string
		}
		oauth: {
			google: {
				clientId: string
				clientSecret: string
			}
		}
	}
	interface PublicRuntimeConfig {
		s3PublicUrl: string
		seedKey: string
	}
}

export {}
