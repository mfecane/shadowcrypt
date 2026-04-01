import { Optional } from 'typescript-optional'
import { EnvironmentResolver } from '~~/lib/EnvironmentResolver'
import { getStorageEnvPrefix } from '~~/lib/storage/storageEnvPrefix'
import { DesignImageType } from '~~/server/storage/DesignImageType'
import { ImageSizeVariant } from '~~/server/storage/ImageSizeVariant'
import { StorageKey } from '~~/server/storage/key/StorageKey'

export class StorageKeyFactory {
	private readonly seedKey = process.env.NUXT_PUBLIC_SEED_KEY ?? ''

	private readonly s3PublicUrl = Optional.ofNullable(
		process.env.NUXT_PUBLIC_S3_PUBLIC_URL || process.env.S3_PUBLIC_URL
	).orElseThrow(() => new Error('NUXT_PUBLIC_S3_PUBLIC_URL / NEXT_PUBLIC_S3_PUBLIC_URL / S3_PUBLIC_URL is not set'))

	private envPrefix: string = ''

	public constructor(environmentResolver: EnvironmentResolver) {
		this.envPrefix = getStorageEnvPrefix(environmentResolver.getEnvironmentKey(), this.seedKey)
	}

	public createDesignImageKey(
		designId: string,
		type: DesignImageType,
		variant: ImageSizeVariant,
		hash: string
	): StorageKey {
		const key = new StorageKey(this.envPrefix, this.s3PublicUrl)
		key.setPath(['design', designId, type, variant])
		key.setHash(hash)
		key.setExtension('webp')
		return key
	}

	public createUserAvatarKey(userId: string, hash: string): StorageKey {
		const key = new StorageKey(this.envPrefix, this.s3PublicUrl)
		key.setPath(['user', userId, 'avatar'])
		key.setHash(hash)
		key.setExtension('webp')
		return key
	}

	public createChatMessageImageKey(conversationId: string, variant: ImageSizeVariant, hash: string): StorageKey {
		const key = new StorageKey(this.envPrefix, this.s3PublicUrl)
		key.setPath(['chat', conversationId, 'images', variant])
		key.setHash(hash)
		key.setExtension('webp')
		return key
	}

	public createDesignProjectImageKey(
		designId: string,
		projectId: string,
		variant: ImageSizeVariant,
		hash: string
	): StorageKey {
		const key = new StorageKey(this.envPrefix, this.s3PublicUrl)
		key.setPath(['designs', designId, 'project', projectId, 'images', variant])
		key.setHash(hash)
		key.setExtension('webp')
		return key
	}

	/**
	 * Collection gallery image: `{envPrefix}/collections/{collectionId}/images/{variant}/{hash}.webp`
	 */
	public createCollectionImageKey(collectionId: string, variant: ImageSizeVariant, hash: string): StorageKey {
		const key = new StorageKey(this.envPrefix, this.s3PublicUrl)
		key.setPath(['collections', collectionId, 'images', variant])
		key.setHash(hash)
		key.setExtension('webp')
		return key
	}

	/** Prefix for listing/deleting all image objects under a collection (both variants). */
	public getCollectionImageListPrefix(collectionId: string): string {
		return `${this.envPrefix}/collections/${collectionId}/images`
	}
}
