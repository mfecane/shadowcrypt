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
	const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
	const charactersLength = characters.length
	let counter = 0
	while (counter < length) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength))
		counter += 1
	}
	return result
}
