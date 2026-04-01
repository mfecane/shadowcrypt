import { buildUserAvatarPublicUrl } from '~~/lib/storage/userAvatarPublicUrl'
import { getStorageEnvPrefixForClient } from '~~/lib/storage/clientStoragePrefix'

function isExternalAvatarUrl(ref: string): boolean {
	return ref.startsWith('http://') || ref.startsWith('https://')
}

export function getUserAvatarDisplayUrl(
	user: { id: string; avatarRef: string | null },
	publicCfg: { s3PublicUrl: string; seedKey: string }
): string {
	const raw = user.avatarRef
	if (raw === null) {
		return ''
	}
	if (isExternalAvatarUrl(raw)) {
		return raw
	}
	const storagePrefix = getStorageEnvPrefixForClient(publicCfg.seedKey)
	return buildUserAvatarPublicUrl(user.id, raw, publicCfg.s3PublicUrl, storagePrefix)
}
