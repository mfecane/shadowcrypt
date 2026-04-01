import type { RuntimeConfig } from 'nuxt/schema'
import { EmailNonceService } from '~~/lib/auth/emailNonce'
import { ServiceAlias } from '~~/lib/di/ServiceAlias'
import { registerServerServices } from '~~/lib/di/registerServerServices'
import { container } from './container'

function requireString(value: unknown, label: string): string {
	if (typeof value !== 'string' || value === '') {
		throw new Error(`${label} is not configured`)
	}
	return value
}

export function registerServicesFromRuntimeConfig(config: RuntimeConfig): void {
	container.clear()

	const authNoncePepper = requireString(config.auth.emailNoncePepper, 'runtimeConfig.auth.emailNoncePepper')
	container.registerSingleton(ServiceAlias.EmailNonceService, () => new EmailNonceService(authNoncePepper))

	const s3PublicUrl = config.public.s3PublicUrl
	const seedKey = config.public.seedKey
	if (typeof s3PublicUrl !== 'string' || s3PublicUrl === '' || typeof seedKey !== 'string' || seedKey === '') {
		return
	}

	registerServerServices()
}
