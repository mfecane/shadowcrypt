import { Optional } from 'typescript-optional'

export type Vector2 = { x: number; y: number }

export function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(value, max))
}

export async function getImageDimensions(src: string): Promise<[width: number, height: number]> {
	return new Promise((resolve, reject) => {
		const img = new Image()
		img.onload = function () {
			resolve([img.width, img.height])
		}
		img.onerror = function (e) {
			reject(e)
		}
		img.src = src
	})
}

export function nn<T>(arg: T | null | undefined, msg: string = 'Internal error'): T {
	return Optional.ofNullable(arg).orElseThrow(() => new Error(msg))
}
