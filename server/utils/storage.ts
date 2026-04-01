import { container } from '~~/lib/di/container'
import { ServiceAlias } from '~~/lib/di/ServiceAlias'
import type { StorageClient } from '~~/server/storage/client/StorageClient'

export function useStorageClient(): StorageClient {
	return container.resolve(ServiceAlias.StorageClient)
}
