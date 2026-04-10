/** Max raw bytes accepted for a collection image upload before decoding (multipart file). */
// TODO unused, make it used somewhere
export const MAX_COLLECTION_IMAGE_UPLOAD_BYTES = 2 * 1024 * 1024 // 2MB

/** Max edge length (px) for the stored “original” WebP variant in collection uploads. */
export const FULL_IMAGE_WIDTH = 1024

/** Quality of the stored “original” WebP variant in collection uploads. */
export const FULL_IMAGE_QUALITY = 0.6

/** Max edge length (px) for the stored “small” WebP variant in collection uploads. */
export const PREVIEW_IMAGE_WIDTH = 256

/** Quality of the stored “small” WebP variant in collection uploads. */
export const SMALL_IMAGE_QUALITY = 0.6
