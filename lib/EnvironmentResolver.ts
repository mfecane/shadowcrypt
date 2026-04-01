import { EnvironmentType } from '~~/lib/EnvironmentType'

export class EnvironmentResolver {
	public getEnvironmentKey(): EnvironmentType {
		if (process.env.VERCEL_ENV === 'preview') {
			return EnvironmentType.Preview
		}
		if (process.env.VERCEL_ENV === 'production') {
			return EnvironmentType.Production
		}
		if (process.env.NODE_ENV !== 'production') {
			return EnvironmentType.Local
		}
		return EnvironmentType.Production
	}
}
