import { Optional } from 'typescript-optional'

const FILENAME_CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_'

export function isImageUrl(url: string): boolean {
	const regex = /\/([^\/]+)\.(\w+)(?:[\?#].*)?$/
	const matches = url.match(regex)
	if (!matches || !matches.length) {
		return false
	}
	const extension = matches[2]
	return ['jpg', 'png'].includes(extension.toLowerCase())
}

// TODO read dimensions on upload
export async function getImageDimensions(src: string): Promise<[width: number, height: number]> {
	return new Promise((resolve, reject) => {
		let img = new Image()

		img.onload = function () {
			resolve([img.width, img.height])
		}

		img.onerror = function (e) {
			reject(e)
		}

		img.src = src
	})
}

export function clamp(value: number, min: number, max: number) {
	return Math.max(min, Math.min(value, max))
}

export function makeid(length: number): string {
	let result = ''
	const charactersLength = FILENAME_CHARACTERS.length
	for (let i = 0; i < length; ++i) {
		result += FILENAME_CHARACTERS.charAt(Math.floor(Math.random() * charactersLength))
	}
	return result
}

export type Vector2 = { x: number; y: number }

export async function sleep(timeout: number = 200) {
	await new Promise((resolve) => setTimeout(resolve, timeout))
}

export function nn<T>(arg: T | null | undefined, msg: string = 'Internal error'): T {
	return Optional.ofNullable(arg).orElseThrow(() => Error(msg))
}
