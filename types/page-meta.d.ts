declare module '#app' {
	interface PageMeta {
		auth?:
			| false
			| {
					unauthenticatedOnly?: boolean
					navigateAuthenticatedTo?: string
					navigateUnauthenticatedTo?: string
			  }
	}
}

export {}
