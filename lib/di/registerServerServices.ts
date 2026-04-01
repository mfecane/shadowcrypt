import { ServiceAlias } from '~~/lib/di/ServiceAlias'
import { EnvironmentResolver } from '~~/lib/EnvironmentResolver'
import { StorageClientFactory } from '~~/server/storage/client/StorageClientFactory'
import { StorageKeyFactory } from '~~/server/storage/key/StorageKeyFactory'
import { container } from './container'

export function registerServerServices(): void {
	container.registerSingleton(ServiceAlias.EnvironmentResolver, () => new EnvironmentResolver())

	container.registerSingleton(ServiceAlias.StorageKeyFactory, (c) => {
		return new StorageKeyFactory(c.resolve(ServiceAlias.EnvironmentResolver))
	})

	container.registerSingleton(ServiceAlias.StorageClientFactory, () => new StorageClientFactory())

	container.registerSingleton(ServiceAlias.StorageClient, (c) => {
		return c.resolve<StorageClientFactory>(ServiceAlias.StorageClientFactory).create()
	})
}
