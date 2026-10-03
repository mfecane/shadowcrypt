import type { CropArea } from '~~/lib/imageCropper/types'

function loadImageElement(url: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const image = new Image()
		image.addEventListener('load', () => resolve(image), { once: true })
		image.addEventListener('error', () => reject(new Error('Failed to load image')), { once: true })
		image.src = url
	})
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
	return new Promise((resolve, reject) => {
		canvas.toBlob(
			(blob) => {
				if (blob === null) {
					reject(new Error('Canvas toBlob failed'))
					return
				}
				resolve(blob)
			},
			type,
			quality
		)
	})
}

function canvasContext2d(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
	const ctx = canvas.getContext('2d')
	if (ctx === null) {
		throw new Error('Canvas 2D context unavailable')
	}
	return ctx
}

/** Client-side pre-upload image processing: cropping to a selected area and downscaling before the request is sent. */
export class ClientImagePreprocessor {
	public async crop(file: File, area: CropArea): Promise<Blob> {
		const url = URL.createObjectURL(file)
		try {
			const image = await loadImageElement(url)
			const canvas = document.createElement('canvas')
			canvas.width = Math.max(1, Math.round(area.width))
			canvas.height = Math.max(1, Math.round(area.height))
			canvasContext2d(canvas).drawImage(image, area.x, area.y, area.width, area.height, 0, 0, canvas.width, canvas.height)
			return await canvasToBlob(canvas, file.type !== '' ? file.type : 'image/png', 1)
		} finally {
			URL.revokeObjectURL(url)
		}
	}

	/** Downscales `source` so its longest edge is at most `maxEdge`, re-encoding to WebP; leaves smaller images untouched in size, just re-encoded. */
	public async resize(source: Blob, maxEdge: number, quality: number): Promise<Blob> {
		const bitmap = await createImageBitmap(source)
		try {
			const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
			const width = Math.max(1, Math.round(bitmap.width * scale))
			const height = Math.max(1, Math.round(bitmap.height * scale))
			const canvas = document.createElement('canvas')
			canvas.width = width
			canvas.height = height
			canvasContext2d(canvas).drawImage(bitmap, 0, 0, width, height)
			return await canvasToBlob(canvas, 'image/webp', quality)
		} finally {
			bitmap.close()
		}
	}
}
