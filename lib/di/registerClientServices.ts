import { StorageKeyFactory } from '~~/server/storage/key/StorageKeyFactory'
import { EnvironmentResolver } from '../EnvironmentResolver'
import { container } from './container'
import { ServiceAlias } from './ServiceAlias'

export function registerClientServices(): void {
	container.registerSingleton(ServiceAlias.EnvironmentResolver, () => new EnvironmentResolver())

	container.registerSingleton(ServiceAlias.StorageKeyFactory, (c) => {
		return new StorageKeyFactory(c.resolve(ServiceAlias.EnvironmentResolver))
	})
}
