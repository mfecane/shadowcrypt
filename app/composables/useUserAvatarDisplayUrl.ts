import { getUserAvatarDisplayUrl } from '~~/lib/auth/userAvatarDisplayUrl'

export function useUserAvatarDisplayUrl(): ComputedRef<string> {
	const { user } = useUserSession()
	const config = useRuntimeConfig()
	return computed(() => {
		const u = user.value
		if (u === null) {
			return ''
		}
		return getUserAvatarDisplayUrl(
			{ id: u.id, avatarRef: u.avatarRef },
			config.public
		)
	})
}
