export default defineEventHandler(async (event) => {
	await clearUserSession(event)
	const names = Object.keys(parseCookies(event))
	for (const name of names) {
		if (
			name.includes('authjs') ||
			name.includes('next-auth') ||
			name === 'session_id_token' ||
			name === 'session_refresh_token'
		) {
			setCookie(event, name, '', { path: '/', maxAge: 0 })
		}
	}
	return { ok: true }
})
