/** Budgets enforced on a collection image upload, checked after client-side resize and again on the server. */
export const COLLECTION_IMAGE_UPLOAD = {
	/** Max bytes accepted for the upload. */
	MAX_BYTES: 5 * 1024 * 1024,
	/** Max decoded pixel count (width × height); guards against decompression-bomb inputs before sharp decodes pixel data. */
	MAX_PIXELS: 20_000_000,
}

/** Stored “original” WebP variant of a collection image. */
export const FULL_IMAGE = {
	/** Max edge length (px). */
	WIDTH: 1400,
	/** WebP encode quality. */
	QUALITY: 0.8,
	/** Sharpen sigma. Mild, since this one isn't downscaled as much. */
	SHARPEN_SIGMA: 0.5,
}

/** Stored “small” WebP variant of a collection image. */
export const SMALL_IMAGE = {
	/** Max edge length (px). */
	WIDTH: 256,
	/** WebP encode quality. */
	QUALITY: 0.6,
	/** Sharpen sigma. Stronger, since the heavier downscale to {@link SMALL_IMAGE.WIDTH} softens detail more. */
	SHARPEN_SIGMA: 1.2,
}

/**
 * The client's pre-upload downscale + encode, done before the file is sent to the server.
 * Max edge kept at ~1.5× {@link FULL_IMAGE.WIDTH} so the server's resize to the final master still has
 * supersampled detail to work with instead of being a 1:1 re-encode. Quality kept high since this is a
 * transfer intermediate, not the final stored master — the server re-encodes it again.
 */
export const CLIENT_PREUPLOAD = {
	MAX_EDGE: Math.round(FULL_IMAGE.WIDTH * 1.5),
	QUALITY: 0.92,
}
