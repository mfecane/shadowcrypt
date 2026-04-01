import { ServiceAlias } from '~~/lib/di/ServiceAlias'

type ResolveFn = (c: DiContainer) => unknown

export class DiContainer {
	private readonly singletons = new Map<ServiceAlias, unknown>()

	private readonly factories = new Map<ServiceAlias, ResolveFn>()

	public registerSingleton(key: ServiceAlias, factory: ResolveFn): void {
		this.factories.set(key, factory)
	}

	public resolve<T>(key: ServiceAlias): T {
		const existing = this.singletons.get(key)
		if (existing !== undefined) {
			return existing as T
		}
		const factory = this.factories.get(key)
		if (factory === undefined) {
			throw new Error(`DI: not registered: ${key}`)
		}
		const instance = factory(this) as T
		this.singletons.set(key, instance)
		return instance
	}

	public clear(): void {
		this.singletons.clear()
	}
}

export const container = new DiContainer()
