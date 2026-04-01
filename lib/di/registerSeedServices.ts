import { registerServerServices } from './registerServerServices'
import { container } from './container'

export function registerSeedServices(): void {
	container.clear()
	registerServerServices()
}
