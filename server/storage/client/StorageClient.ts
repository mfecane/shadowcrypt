import { DesignImageType } from '~~/server/storage/DesignImageType'
import { ImageSizeVariant } from '~~/server/storage/ImageSizeVariant'
import { StorageKey } from '~~/server/storage/key/StorageKey'

/**
 * Abstraction for S3-compatible object storage (MinIO, Cloudflare R2, etc.).
 */
export interface StorageClient {
	/**
	 * Uploads original and small WebP objects for one design image hash (via {@link uploadImageWithPreview}).
	 */
	uploadDesignImage(
		designId: string,
		type: DesignImageType,
		hash: string,
		image: Buffer | Uint8Array | Blob
	): Promise<void>

	/**
	 * Builds a design image key (no upload) for URLs or path checks.
	 *
	 * @param designId - Design row id.
	 * @param type - Gallery vs render segment.
	 * @param variant - Size / role segment (e.g. original vs small).
	 * @param hash - Content hash in the key.
	 */
	getDesignImageUrl(designId: string, type: DesignImageType, variant: ImageSizeVariant, hash: string): StorageKey

	/**
	 * Uploads original and small WebP objects for one chat message image hash (via {@link uploadImageWithPreview}).
	 */
	uploadChatImage(conversationId: string, hash: string, image: Buffer | Uint8Array | Blob): Promise<void>

	/**
	 * Public HTTPS URL for a chat message image object.
	 */
	getChatMessageImageUrl(conversationId: string, variant: ImageSizeVariant, hash: string): StorageKey

	/**
	 * Uploads a user avatar for the given content hash.
	 *
	 * @param userId - User id.
	 * @param hash - Version id stored alongside the profile (e.g. UUID).
	 * @param image - Encoded image bytes.
	 */
	uploadUserAvatar(userId: string, hash: string, image: Buffer | Uint8Array | Blob): Promise<void>

	/**
	 * Public HTTPS URL for the avatar object for this user and hash.
	 *
	 * @param userId - User id.
	 * @param hash - Same hash as stored on the profile.
	 */
	getUserAvatarUrl(userId: string, hash: string): StorageKey

	/**
	 * Uploads a design project image for the given content hash.
	 *
	 * @param designId - Design id.
	 * @param projectId - Project id.
	 * @param variant - Size / role segment (e.g. original vs small).
	 * @param hash - Content hash in the key.
	 * @param image - Encoded image bytes.
	 */
	uploadDesignProjectImage(
		designId: string,
		projectId: string,
		hash: string,
		image: Buffer | Uint8Array | Blob
	): Promise<void>

	/**
	 *
	 * @param designId
	 * @param projectId
	 * @param variant
	 * @param hash
	 */
	getDesignProjectImageUrl(designId: string, projectId: string, variant: ImageSizeVariant, hash: string): StorageKey

	/**
	 * Uploads original + small WebP for one collection image (via {@link uploadImageWithPreview}).
	 * Stored edge length is capped by `COLLECTION_IMAGE_MAX_STORED_EDGE_PX` in `lib/collectionImageUploadConstants`.
	 *
	 * @param collectionId - Collection row id.
	 * @param hash - Object id (e.g. UUID) stored in DB.
	 * @param image - Source image bytes (decoded by sharp pipeline).
	 */
	uploadCollectionImage(
		collectionId: string,
		hash: string,
		image: Buffer | Uint8Array | Blob
	): Promise<void>

	/**
	 * Public URL key for a collection image variant.
	 */
	getCollectionImageUrl(collectionId: string, variant: ImageSizeVariant, hash: string): StorageKey

	/**
	 * Deletes all stored images for a collection (both size variants for all hashes).
	 */
	deleteCollectionImages(collectionId: string): Promise<void>

	/**
	 * Uploads an arbitrary object described by a key implementation.
	 *
	 * @param key - Domain or raw key.
	 * @param body - Object body.
	 * @param contentType - MIME type.
	 * @param bucket - Optional bucket override.
	 */
	uploadObject(
		key: StorageKey,
		body: Buffer | Uint8Array | Blob,
		contentType: string,
		bucket?: string
	): Promise<StorageKey>

	/**
	 * Deletes one object by key.
	 *
	 * @param key - Object key in the bucket.
	 * @param bucket - Optional bucket override.
	 */
	deleteFile(key: string, bucket?: string): Promise<void>

	/**
	 * Uploads original and preview sizes for a design image key (implementation-defined layout).
	 *
	 * @param key - Base design key (owner + hash; variants appended internally).
	 * @param image - Source image bytes.
	 */
	uploadImageWithPreview(key: StorageKey, image: Buffer | Uint8Array | Blob): Promise<StorageKey>

	/**
	 * Lists object keys under an optional prefix.
	 *
	 * @param prefix - Key prefix filter.
	 * @param bucket - Optional bucket override.
	 */
	listFiles(prefix?: string, bucket?: string): Promise<string[]>
}
