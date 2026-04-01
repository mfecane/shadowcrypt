export default defineNuxtRouteMiddleware(async (to) => {
	const { loggedIn, ready, fetch: fetchSession } = useUserSession()
	if (!ready.value) {
		await fetchSession()
	}

	const authMeta = to.meta.auth

	if (authMeta === false) {
		return
	}

	const guestOnly =
		typeof authMeta === 'object' &&
		authMeta !== null &&
		'unauthenticatedOnly' in authMeta &&
		authMeta.unauthenticatedOnly === true

	if (guestOnly) {
		if (loggedIn.value) {
			const dest =
				typeof authMeta === 'object' &&
				authMeta !== null &&
				'navigateAuthenticatedTo' in authMeta &&
				typeof authMeta.navigateAuthenticatedTo === 'string'
					? authMeta.navigateAuthenticatedTo
					: '/list'
			return navigateTo(dest)
		}
		return
	}

	if (!loggedIn.value) {
		const dest =
			typeof authMeta === 'object' &&
			authMeta !== null &&
			'navigateUnauthenticatedTo' in authMeta &&
			typeof authMeta.navigateUnauthenticatedTo === 'string'
				? authMeta.navigateUnauthenticatedTo
				: '/auth/gate'
		if (dest === '/auth/gate') {
			return navigateTo({ path: dest, query: { callbackUrl: to.fullPath } })
		}
		return navigateTo(dest)
	}
})
