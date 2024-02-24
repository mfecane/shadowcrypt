import img1 from '/images/albedo.jpg'
import img2 from '/images/biba.jpg'
import img3 from '/images/moto.jpg'
import img4 from '/images/priestess.jpg'
import img5 from '/images/dancer.jpg'
import img6 from '/images/bastien.jpg'

const img = [img1, img2, img3, img4, img5, img6]

interface ImageData {
	src: string
	width: number
	height: number
}

export interface ImageCollection {
	index: number
	images: ImageData[]
}

// TODO remove
export class Imageslist {
	collections: ImageCollection[] = []
	length = 0

	constructor() {
		this.length = Math.floor(Math.random() * 30)
	}

	async createItems(): Promise<Imageslist> {
		this.collections = await Promise.all(
			new Array(this.length).fill(undefined).map(async (el, index) => await this.createItem(index))
		)
		return this
	}

	async createItem(index: number): Promise<ImageCollection> {
		let length = Math.floor(Math.random() * 50)

		let images = await Promise.all(
			new Array(length).fill(undefined).map(async (): Promise<ImageData> => {
				let src = img[Math.floor(Math.random() * img.length)]
				let [width, height] = await this.readImageDimensions(src)
				return {
					src,
					width,
					height,
				}
			})
		)

		return {
			index: index,
			images: images,
		}
	}

	getItems(from: number, num?: number) {
		if (!from && !num) {
			return this.collections.slice()
		}

		if (!num) {
			return this.collections.slice(from, this.collections.length - 1)
		}

		return this.collections.slice(from, num)
	}

	async readImageDimensions(src: string): Promise<[width: number, height: number]> {
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
}

export const imageslist = await new Imageslist().createItems()
