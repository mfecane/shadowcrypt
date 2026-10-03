/**
 * Server-side image processing (sharp). Used by seed, API routes, and storage uploads.
 */

import sharp from 'sharp'
import { COLLECTION_IMAGE_UPLOAD, FULL_IMAGE, SMALL_IMAGE } from './config/image'

/** sharp() with a decompression-bomb guard: rejects input whose pixel count exceeds the budget before decoding pixel data. */
function openImage(inputPath: string | Buffer): sharp.Sharp {
	return sharp(inputPath, { limitInputPixels: COLLECTION_IMAGE_UPLOAD.MAX_PIXELS })
}

export async function processImageToWebP(
	inputPath: string | Buffer,
	maxWidth: number,
	quality: number = FULL_IMAGE.QUALITY,
	sharpenSigma: number = FULL_IMAGE.SHARPEN_SIGMA
): Promise<Buffer> {
	const image = openImage(inputPath)
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
		.sharpen({ sigma: sharpenSigma })
		.webp({ quality: Math.round(quality * 100) })
		.toBuffer()

	return processed
}

export async function processImageToOriginal(inputPath: string | Buffer): Promise<Buffer> {
	return processImageToWebP(inputPath, FULL_IMAGE.WIDTH, FULL_IMAGE.QUALITY, FULL_IMAGE.SHARPEN_SIGMA)
}

export async function processImageToSmall(inputPath: string | Buffer): Promise<Buffer> {
	return processImageToWebP(inputPath, SMALL_IMAGE.WIDTH, SMALL_IMAGE.QUALITY, SMALL_IMAGE.SHARPEN_SIGMA)
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
	const image = openImage(inputPath)
	const metadata = await image.metadata()

	if (!metadata.width || !metadata.height) {
		throw new Error('INVALID_IMAGE_DIMENSIONS')
	}

	const scale = Math.min(1, FULL_IMAGE.WIDTH / Math.max(metadata.width, metadata.height))
	return {
		width: Math.round(metadata.width * scale),
		height: Math.round(metadata.height * scale),
	}
}
