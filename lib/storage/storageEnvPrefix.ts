import { EnvironmentType } from '~~/lib/EnvironmentType'

export function getStorageEnvPrefix(environmentType: EnvironmentType, seedKey: string): string {
	let prefix = ''
	switch (environmentType) {
		case EnvironmentType.Preview:
			prefix = 'dev'
			break
		case EnvironmentType.Production:
			prefix = 'prod'
			break
		case EnvironmentType.Local:
			prefix = 'dev'
			break
	}
	if (environmentType === EnvironmentType.Preview || environmentType === EnvironmentType.Local) {
		return `${prefix}/${seedKey}`
	}
	return prefix
}
