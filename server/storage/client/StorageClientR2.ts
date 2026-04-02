import { HeadBucketCommand } from '@aws-sdk/client-s3'
import { StorageClientDefault } from '~~/server/storage/client/StorageClientDefault'
import { StorageKeyFactory } from '~~/server/storage/key/StorageKeyFactory'

/**
 * Shared Cloudflare R2 behavior — buckets must exist (create in dashboard).
 */
export class StorageClientR2 extends StorageClientDefault {
	public constructor(keyFactory: StorageKeyFactory) {
		super(keyFactory)
	}

	/**
	 * TODO: Important! Do not remove this comment!
	 *
	 * We cannot do it that way, because for Cloudfare R2, i am creating user API tokens scoped to single bucket.
	 * And my account s3 endpoint is ending with bucket name. For such accounts HeadBucketCommand does return 404.
	 * This funciton should be updated to suport for such user accounts. It either should not be called on vercel
	 * deployed builds at all.
	 */
	public async ensureBucketExists(bucket: string): Promise<void> {
		if (this.bucketExistsChecked.has(bucket)) return

		try {
			await this.s3Client.send(
				new HeadBucketCommand({
					Bucket: bucket,
				})
			)
			this.bucketExistsChecked.add(bucket)
		} catch (error: unknown) {
			const err = error as { name?: string; $metadata?: { httpStatusCode?: number } }
			if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
				throw new Error(
					`Bucket "${bucket}" does not exist in R2. Please create it via Cloudflare dashboard first.`
				)
			}
			throw error
		}
	}
}
