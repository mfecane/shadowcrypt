// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
				compatibilityDate: '2025-07-15',
				devtools: { enabled: true },
				modules: [
				 '@pinia/nuxt',
				 '@nuxt/ui',
				 'nuxt-auth-utils',
				 '@nuxt/eslint',
				],
				srcDir: 'app',
				routeRules: {
								'/landing': { redirect: '/' },
				},
				css: ['~/assets/css/main.css'],
				runtimeConfig: {
								session: {
												maxAge: 60 * 60 * 24 * 30,
												password: process.env.NUXT_SESSION_PASSWORD ?? '',
								},
								databaseUrl: '',
								auth: {
												emailNoncePepper: '',
								},
								oauth: {
												google: {
																clientId: '',
																clientSecret: '',
												},
								},
								public: {
												s3PublicUrl: '',
												seedKey: '',
								},
				},
})