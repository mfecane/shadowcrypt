// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	compatibilityDate: '2025-07-15',
	devtools: { enabled: false },
	modules: ['@pinia/nuxt', '@nuxt/ui', 'nuxt-auth-utils', '@nuxt/eslint'],
	srcDir: 'app',
	routeRules: {
		'/landing': { redirect: '/' },
		'/admin': { redirect: '/admin/jobs' },
	},
	css: ['~/assets/css/main.css'],
	colorMode: {
		preference: 'dark',
	},
	runtimeConfig: {
		session: {
			maxAge: 60 * 60 * 24 * 30,
			password: process.env.NUXT_SESSION_PASSWORD ?? '',
		},
		databaseUrl: '',
		auth: {
			emailNoncePepper: '',
		},
		jobSecret: process.env.JOB_SECRET ?? '',
		demoUser: process.env.NUXT_DEMO_USER ?? '',
		oauth: {
			google: {
				clientId: '',
				clientSecret: '',
			},
		},
		public: {
			s3PublicUrl: '',
			seedKey: '',
			demo: process.env.NUXT_DEMO === 'true',
			debugPixiCanvas: process.env.DEBUG_PIXI_CANVAS === 'true',
		},
	},
	app: {
		head: {
			// TODO add icons from assets
			link: [{ rel: 'manifest', href: '/site.webmanifest' }],
		},
	},
})
