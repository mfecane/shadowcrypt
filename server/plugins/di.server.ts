import { registerServicesFromRuntimeConfig } from '~~/lib/di/registerServicesFromRuntimeConfig'

export default defineNitroPlugin(() => {
	const config = useRuntimeConfig()
	registerServicesFromRuntimeConfig(config)
})
