import { ServiceAlias } from '~~/lib/di/ServiceAlias'
import { container } from '~~/lib/di/container'
import { EnvironmentResolver } from '~~/lib/EnvironmentResolver'
import { EnvironmentType } from '~~/lib/EnvironmentType'
import { StorageClient } from '~~/server/storage/client/StorageClient'
import { StorageClientMinIO } from '~~/server/storage/client/StorageClientMinIO'
import { StorageClientR2 } from '~~/server/storage/client/StorageClientR2'
import { StorageKeyFactory } from '~~/server/storage/key/StorageKeyFactory'

export class StorageClientFactory {
	private readonly environmentResolver: EnvironmentResolver = container.resolve(ServiceAlias.EnvironmentResolver)

	private readonly storageKeyFactory: StorageKeyFactory = container.resolve(ServiceAlias.StorageKeyFactory)

	public create(): StorageClient {
		const env = this.environmentResolver.getEnvironmentKey()
		switch (env) {
			case EnvironmentType.Preview:
			case EnvironmentType.Production:
				return new StorageClientR2(this.storageKeyFactory)
			case EnvironmentType.Local:
				return new StorageClientMinIO(this.storageKeyFactory)
		}
	}
}
