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
