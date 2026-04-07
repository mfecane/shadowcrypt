import { LogPanel } from '~~/lib/LogPanel'
import { StorageKeyFactory } from '~~/server/storage/key/StorageKeyFactory'
import { EnvironmentResolver } from '../EnvironmentResolver'
import { container } from './container'
import { ServiceAlias } from './ServiceAlias'

interface Config {
	public: {
		debugPixiCanvas: boolean
	}
}

export function registerClientServices(config: Config): void {
	container.registerSingleton(ServiceAlias.EnvironmentResolver, () => new EnvironmentResolver())

	container.registerSingleton(ServiceAlias.StorageKeyFactory, (c) => {
		return new StorageKeyFactory(c.resolve(ServiceAlias.EnvironmentResolver))
	})

	container.registerSingleton(ServiceAlias.LogPanel, () => {
		return new LogPanel(config.public.debugPixiCanvas)
	})
}
