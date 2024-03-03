import { nn } from './utils'

function allowed(type: string) {
	if (['image/jpeg', 'image/png'].includes(type)) {
		return true
	}
	throw new Error('file type is not allowed for resizing')
}

interface ResizeImageArgs {
	file: File
	width?: number
	height?: number
	quality: number
}

export function resizeImage({ file, width, height, quality }: ResizeImageArgs): Promise<File> {
	return new Promise(function (resolve, reject) {
		try {
			if (file.name && file.name.split('.').reverse()[0] && allowed(file.type) && file.size) {
				const fileName = file.name
				const reader = new FileReader()
				reader.readAsDataURL(file)
				reader.onload = (event: ProgressEvent<FileReader>) => {
					const img = new Image()
					//@ts-ignore
					img.src = nn<string>(event.target.result)
					;(img.onload = () => {
						const aspect = getAspect(img.width, img.height, width, height)
						const imgWidth = img.width * aspect
						const imgHeight = img.height * aspect
						const elem = document.createElement('canvas')
						elem.width = imgWidth
						elem.height = imgHeight
						const ctx = nn(elem.getContext('2d'))
						ctx.drawImage(img, 0, 0, imgWidth, imgHeight)
						ctx.canvas.toBlob(
							(blob) => {
								const file2 = new File([nn(blob)], fileName, {
									type: file.type,
									lastModified: Date.now(),
								})
								resolve(file2)
							},
							file.type,
							quality
						)
					}),
						(reader.onerror = (error) => reject(error))
				}
			} else {
				reject('File not supported!')
			}
		} catch (error) {
			console.log('Error while image resize: ', error)
			reject(error)
		}
	})
}

function getAspect(width: number, height: number, maxWidth: number = 0, maxHeight: number = 0): number {
	let ratio = 1
	if (maxWidth && width > 0 && width > maxWidth) {
		ratio = Math.min(maxWidth / width, ratio)
	}
	if (maxHeight && height > 0 && height > maxHeight) {
		ratio = Math.min(maxHeight / height, ratio)
	}
	return ratio
}
