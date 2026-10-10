import { eq, isNull, not } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { boards, images, users } from '~~/server/db/schema'
import type * as schema from '~~/server/db/schema'
import type { StorageClient } from '~~/server/storage/client/StorageClient'
import { ImageSizeVariant } from '~~/server/storage/ImageSizeVariant'
import type { StorageKeyFactory } from '~~/server/storage/key/StorageKeyFactory'

const DELETE_BATCH_SIZE = 50

/** Deletes storage objects of the current environment that no database row references. */
export class OrphanFilesCleanupJob {
	public constructor(
		private readonly storage: StorageClient,
		private readonly keyFactory: StorageKeyFactory,
		private readonly db: NodePgDatabase<typeof schema>
	) {}

	public async run(onProgress: (message: string) => void): Promise<string> {
		onProgress('Listing files in storage...')
		const storageKeys = await this.storage.listFiles(this.keyFactory.getEnvListPrefix())
		onProgress(`Found ${storageKeys.length} files in storage`)

		const referencedKeys = new Set<string>()
		await this.collectAvatarKeys(referencedKeys)
		await this.collectCollectionImageKeys(referencedKeys)
		onProgress(`Found ${referencedKeys.size} referenced files`)

		const orphanKeys = storageKeys.filter((key) => !referencedKeys.has(key))
		onProgress(`Found ${orphanKeys.length} orphan files`)

		let deleted = 0
		for (let i = 0; i < orphanKeys.length; i += DELETE_BATCH_SIZE) {
			const batch = orphanKeys.slice(i, i + DELETE_BATCH_SIZE)
			await Promise.all(batch.map((key) => this.storage.deleteFile(key)))
			deleted += batch.length
			onProgress(`Deleted ${deleted}/${orphanKeys.length} files...`)
		}

		return `Deleted ${deleted} orphan files`
	}

	private async collectAvatarKeys(referencedKeys: Set<string>): Promise<void> {
		const rows = await this.db
			.select({ id: users.id, image: users.image })
			.from(users)
			.where(not(isNull(users.image)))
		for (const row of rows) {
			// External avatar URLs are not stored in our bucket
			if (row.image === null || row.image.startsWith('http')) {
				continue
			}
			referencedKeys.add(this.keyFactory.createUserAvatarKey(row.id, row.image).get())
		}
	}

	private async collectCollectionImageKeys(referencedKeys: Set<string>): Promise<void> {
		const rows = await this.db
			.select({ hash: images.hash, collectionId: boards.collectionId })
			.from(images)
			.innerJoin(boards, eq(images.boardId, boards.id))
		for (const row of rows) {
			referencedKeys.add(
				this.keyFactory.createCollectionImageKey(row.collectionId, ImageSizeVariant.ORIGINAL, row.hash).get()
			)
			referencedKeys.add(
				this.keyFactory.createCollectionImageKey(row.collectionId, ImageSizeVariant.SMALL, row.hash).get()
			)
		}
	}
}
