import { registerClientServices } from '~~/lib/di/registerClientServices'

export default defineNuxtPlugin(() => {
	registerClientServices()
})
