import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'

export default defineNuxtPlugin((nuxtApp) => {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 60_000,
			},
		},
	})
	nuxtApp.vueApp.use(VueQueryPlugin, { queryClient })
})
