/**
 * Same object key and public URL shape as {@link StorageKeyFactory.createUserAvatarKey}.
 */
export function buildUserAvatarPublicUrl(
	userId: string,
	hash: string,
	s3PublicUrl: string,
	storagePrefix: string
): string {
	if (s3PublicUrl.endsWith('/')) {
		throw new Error('buildUserAvatarPublicUrl: s3PublicUrl must not end with "/"')
	}
	const key = `${storagePrefix}/user/${userId}/avatar/${hash}.webp`
	return `${s3PublicUrl}/${key}`
}
