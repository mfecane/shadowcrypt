/**
 * Dev seed: default user, folders, ~30% more collections than the original 10 (13 total, 2 pinned), 8–12 images per collection, WebP uploads in MinIO.
 * Each image is a random pick from `scripts/images/`, uploaded via {@link StorageClient.uploadCollectionImage}.
 * Randomness is deterministic ({@link createSeededRandom} / {@link createSeededIdGenerator} keyed by SEED_USER_EMAIL).
 * Each run removes the prior seed user (same email) and re-inserts; clears prior collection objects in S3.
 * Edit SEED_USER_EMAIL before running if you want a different account.
 */
import { config } from 'dotenv'
import { eq } from 'drizzle-orm'
import { computeDefaultLayoutRects } from '../lib/collectionLayout/computeDefaultLayoutRects'
import { drizzle } from 'drizzle-orm/node-postgres'
import { readFile, readdir } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'
import sharp from 'sharp'

import { container } from '../lib/di/container'
import { registerSeedServices } from '../lib/di/registerSeedServices'
import { ServiceAlias } from '../lib/di/ServiceAlias'
import { createSeededIdGenerator, createSeededRandom } from '../lib/math/random'
import { collections, folders, images, userProfiles, users } from '../server/db/schema'
import type { StorageClient } from '../server/storage/client/StorageClient'

const rootDir = fileURLToPath(new URL('..', import.meta.url))
const seedImagesDir = fileURLToPath(new URL('images/collection', import.meta.url))

config({ path: resolve(rootDir, '.env') })
config({ path: resolve(rootDir, '.env.local') })

/** Change this to your preferred test email. */
const SEED_USER_EMAIL = 'aaliapkin@gmail.com'

const DEMO_USER_EMAIL = process.env.NUXT_DEMO_USER ?? 'demo@shadowcrypt.app'
const DEMO_USER_NAME = 'Demo User'

const SEED_USER_NAME = 'Aleksei Aliapkin'

/** Original baseline was 10; seed ~30% more. */
const SEED_COLLECTION_COUNT = Math.ceil(10 * 1.3)

const SEED_FOLDER_NAMES = ['Work in progress', 'References', 'Archive'] as const

const SEED_COLLECTION_NAMES = [
	'Urban geometry',
	'Coastal fog',
	'Botanical macro',
	'Night markets',
	'Film stills',
	'Sketchbook scans',
	'Minimal interiors',
	'Seasonal foliage',
	'Experimental exposures',
	'Commute fragments',
	'Industrial textures',
	'Soft light studies',
	'Street typologies',
] as const

/** Inclusive min/max images per collection. */
const IMAGES_PER_COLLECTION_MIN = 8
const IMAGES_PER_COLLECTION_MAX = 12

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|heic|avif)$/i

function randomIntInclusive(rng: () => number, min: number, max: number): number {
	return min + Math.floor(rng() * (max - min + 1))
}

/** Deterministic folder assignment: spread collections across folders; rest stay ungrouped. */
function folderIdForCollectionIndex(index: number, folderIds: string[]): string | null {
	if (folderIds.length < 3) {
		throw new Error('[seed] expected at least 3 folders for assignment map')
	}
	if (index < 4) {
		return folderIds[0]!
	}
	if (index < 7) {
		return folderIds[1]!
	}
	if (index < 9) {
		return folderIds[2]!
	}
	return null
}

registerSeedServices()

async function listSeedSourceFilenames(): Promise<string[]> {
	const names = await readdir(seedImagesDir)
	return names.filter((n) => IMAGE_EXT.test(n))
}

/** Random source file, EXIF-corrected, as buffer for {@link StorageClient.uploadCollectionImage}. */
async function randomPreparedSourceImage(
	rng: () => number
): Promise<{ buffer: Buffer; width: number; height: number }> {
	const files = await listSeedSourceFilenames()
	if (files.length === 0) {
		throw new Error(`No images in ${seedImagesDir} (add jpg, png, heic, …)`)
	}
	const name = files[Math.floor(rng() * files.length)]!
	const inputPath = join(seedImagesDir, name)
	const raw = await readFile(inputPath)
	const rotated = await sharp(raw).rotate().toBuffer()
	const meta = await sharp(rotated).metadata()
	return {
		buffer: rotated,
		width: meta.width ?? 0,
		height: meta.height ?? 0,
	}
}

async function main(): Promise<void> {
	const databaseUrl = process.env.NUXT_DATABASE_URL
	if (databaseUrl === undefined || databaseUrl === '') {
		throw new Error('NUXT_DATABASE_URL is not set')
	}

	const pool = new pg.Pool({ connectionString: databaseUrl })
	const db = drizzle(pool)

	const storage = container.resolve<StorageClient>(ServiceAlias.StorageClient)

	const rng = createSeededRandom(`${SEED_USER_EMAIL}:shadowcrypt-seed:v1`)
	const nextImageHash = createSeededIdGenerator(`${SEED_USER_EMAIL}:collection-image`, {
		namespace: 'hash',
		length: 32,
	})

	const existingSeedUsers = await db.select().from(users).where(eq(users.email, SEED_USER_EMAIL))
	if (existingSeedUsers.length > 0) {
		const userId = existingSeedUsers[0].id
		const existingCols = await db.select().from(collections).where(eq(collections.userId, userId))
		for (const col of existingCols) {
			console.info(`[seed] clear S3 collection images (${col.id})`)
			await storage.deleteCollectionImages(col.id)
		}
	}

	console.info('[seed] clear previous seed user (if any)')
	await db.delete(users).where(eq(users.email, SEED_USER_EMAIL))

	const now = new Date()

	const result = await db.transaction(async (tx) => {
		const [user] = await tx
			.insert(users)
			.values({
				email: SEED_USER_EMAIL,
				name: SEED_USER_NAME,
				roles: ['admin'],
				emailVerified: now,
			})
			.returning()

		if (user === undefined) {
			throw new Error('insert user returned no row')
		}

		console.info(`[seed] user ${user.email} (${user.id})`)

		await tx.insert(userProfiles).values({ userId: user.id })

		if (SEED_COLLECTION_NAMES.length !== SEED_COLLECTION_COUNT) {
			throw new Error('[seed] SEED_COLLECTION_NAMES length must match SEED_COLLECTION_COUNT')
		}

		const insertedFolders = await tx
			.insert(folders)
			.values(
				SEED_FOLDER_NAMES.map((name) => ({
					userId: user.id,
					name,
					updatedAt: now,
				}))
			)
			.returning()

		if (insertedFolders.length !== SEED_FOLDER_NAMES.length) {
			throw new Error('[seed] insert folders returned incomplete rows')
		}

		const folderIds = insertedFolders.map((f) => f.id)

		for (const f of insertedFolders) {
			console.info(`[seed] folder "${f.name}" (${f.id})`)
		}

		const collectionValues = SEED_COLLECTION_NAMES.map((name, i) => ({
			userId: user.id,
			name,
			pinned: i < 2,
			folderId: folderIdForCollectionIndex(i, folderIds),
		}))

		const insertedCols = await tx.insert(collections).values(collectionValues).returning()

		if (insertedCols.length !== SEED_COLLECTION_COUNT) {
			throw new Error('insert collections returned incomplete rows')
		}

		for (const col of insertedCols) {
			console.info(
				`[seed] collection "${col.name}" pinned=${col.pinned} folder=${col.folderId ?? '—'} (${col.id})`
			)
		}

		const imageRows: { collectionId: string; userId: string; hash: string; width: number; height: number }[] = []
		const uploads: { collectionId: string; hash: string; buffer: Buffer }[] = []
		for (const col of insertedCols) {
			const n = randomIntInclusive(rng, IMAGES_PER_COLLECTION_MIN, IMAGES_PER_COLLECTION_MAX)
			console.info(`[seed] "${col.name}" → ${n} images`)
			for (let i = 0; i < n; i++) {
				const { buffer, width, height } = await randomPreparedSourceImage(rng)
				const hash = nextImageHash()
				console.info(`[seed]   #${i + 1} ${width}×${height} → hash ${hash}`)
				imageRows.push({
					collectionId: col.id,
					userId: user.id,
					hash,
					width,
					height,
				})
				uploads.push({ collectionId: col.id, hash, buffer })
			}
		}

		const insertedImages = await tx.insert(images).values(imageRows).returning()

		const insertedByHash = new Map(insertedImages.map((img) => [img.hash, img]))

		for (const col of insertedCols) {
			const orderedForCol = imageRows
				.filter((r) => r.collectionId === col.id)
				.map((r) => {
					const row = insertedByHash.get(r.hash)
					if (row === undefined) {
						throw new Error(`[seed] inserted row missing for hash ${r.hash}`)
					}
					return row
				})
			const rects = computeDefaultLayoutRects(
				orderedForCol.map((img) => ({ id: img.id, width: img.width, height: img.height }))
			)
			for (const img of orderedForCol) {
				const r = rects.get(img.id)
				if (r === undefined) {
					throw new Error(`[seed] layout rect missing for image ${img.id}`)
				}
				await tx
					.update(images)
					.set({
						layoutX: r.x,
						layoutY: r.y,
						layoutW: r.w,
						layoutH: r.h,
					})
					.where(eq(images.id, img.id))
			}
		}

		return { user, uploads }
	})

	console.info(`[seed] S3: upload ${result.uploads.length} collection images`)
	for (const row of result.uploads) {
		try {
			await storage.uploadCollectionImage(row.collectionId, row.hash, row.buffer)
			console.info(`[seed]   ok ${row.collectionId}/${row.hash}`)
		} catch (e) {
			console.warn(`[seed]   fail ${row.collectionId}/${row.hash}`, e)
		}
	}

	console.info(`[seed] done (${result.user.id})`)

	const [existingDemo] = await db.select().from(users).where(eq(users.email, DEMO_USER_EMAIL)).limit(1)
	if (existingDemo === undefined) {
		const [demoUser] = await db
			.insert(users)
			.values({
				email: DEMO_USER_EMAIL,
				name: DEMO_USER_NAME,
				roles: ['demo'],
				emailVerified: now,
			})
			.returning()
		if (demoUser === undefined) {
			throw new Error('[seed] insert demo user returned no row')
		}
		await db.insert(userProfiles).values({ userId: demoUser.id })
		console.info(`[seed] demo user ${demoUser.email} (${demoUser.id})`)
	} else {
		console.info(`[seed] demo user already exists (${DEMO_USER_EMAIL})`)
	}

	await pool.end()
}

main().catch((err: unknown) => {
	console.error(err)
	process.exit(1)
})
