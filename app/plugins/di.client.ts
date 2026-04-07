import { registerClientServices } from '~~/lib/di/registerClientServices'

export default defineNuxtPlugin(() => {
	const config = useRuntimeConfig()
	registerClientServices(config)
})
