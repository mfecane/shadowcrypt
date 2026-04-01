import { EnvironmentType } from '~~/lib/EnvironmentType'
import { getStorageEnvPrefix } from '~~/lib/storage/storageEnvPrefix'

function inferClientEnvironmentType(): EnvironmentType {
	if (import.meta.dev) {
		return EnvironmentType.Local
	}
	const v = import.meta.env.VERCEL_ENV
	if (v === 'preview') {
		return EnvironmentType.Preview
	}
	if (v === 'production') {
		return EnvironmentType.Production
	}
	return EnvironmentType.Production
}

export function getStorageEnvPrefixForClient(seedKey: string): string {
	return getStorageEnvPrefix(inferClientEnvironmentType(), seedKey)
}
