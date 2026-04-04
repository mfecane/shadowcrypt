/**
 * Server-side image processing (sharp). Used by seed, API routes, and storage uploads.
 */

import sharp from 'sharp'
import { FULL_IMAGE_QUALITY, FULL_IMAGE_WIDTH, PREVIEW_IMAGE_WIDTH, SMALL_IMAGE_QUALITY } from './config/image'

export async function processImageToWebP(
	inputPath: string | Buffer,
	maxWidth: number,
	quality: number = FULL_IMAGE_QUALITY
): Promise<Buffer> {
	const image = sharp(inputPath)
	const metadata = await image.metadata()

	if (!metadata.width || !metadata.height) {
		throw new Error('INVALID_IMAGE_DIMENSIONS')
	}

	const scale = Math.min(1, maxWidth / Math.max(metadata.width, metadata.height))
	const targetWidth = Math.round(metadata.width * scale)
	const targetHeight = Math.round(metadata.height * scale)

	const processed = await image
		.resize(targetWidth, targetHeight, {
			fit: 'inside',
			withoutEnlargement: true,
		})
		.webp({ quality: Math.round(quality * 100) })
		.toBuffer()

	return processed
}

export async function processImageToOriginal(inputPath: string | Buffer): Promise<Buffer> {
	return processImageToWebP(inputPath, FULL_IMAGE_WIDTH, FULL_IMAGE_QUALITY)
}

export async function processImageToSmall(inputPath: string | Buffer): Promise<Buffer> {
	return processImageToWebP(inputPath, PREVIEW_IMAGE_WIDTH, SMALL_IMAGE_QUALITY)
}

export async function processImageToBothSizes(inputPath: string | Buffer): Promise<{
	original: Buffer
	small: Buffer
}> {
	const [original, small] = await Promise.all([processImageToOriginal(inputPath), processImageToSmall(inputPath)])

	return { original, small }
}

/** Dimensions of the stored “original” variant (after the same scaling as {@link processImageToOriginal}). */
export async function getCollectionImageStoredDimensions(inputPath: string | Buffer): Promise<{
	width: number
	height: number
}> {
	const image = sharp(inputPath)
	const metadata = await image.metadata()

	if (!metadata.width || !metadata.height) {
		throw new Error('INVALID_IMAGE_DIMENSIONS')
	}

	const scale = Math.min(1, FULL_IMAGE_WIDTH / Math.max(metadata.width, metadata.height))
	return {
		width: Math.round(metadata.width * scale),
		height: Math.round(metadata.height * scale),
	}
}
