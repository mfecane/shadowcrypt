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
		demo: boolean
		demoUser: string
	}
	interface PublicRuntimeConfig {
		s3PublicUrl: string
		seedKey: string
		demo: boolean
	}
}

export {}
