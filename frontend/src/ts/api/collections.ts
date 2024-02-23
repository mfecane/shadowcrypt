import { Collection, CollectionImage, CollectionWithImages } from '@/ts/model/Data'
import { HOST } from './common'
import { getImageDimensions } from '../utils/utils'

export async function getImages(collectionId: string) {
	const paramsObject = {
		collectionId,
	}
	const params = new URLSearchParams(Object.entries(paramsObject))
	const response = await fetch(`${HOST}/get-images?${params}`)

	const images = (await response.json()) as CollectionImage[]

	for (let image of images) {
		const [width, height] = await getImageDimensions(image.path)
		image.width = width
		image.height = height
	}

	return images
}

export async function getCollections() {
	const response = await fetch(`${HOST}/get-collections`)
	const collections = (await response.json()) as Collection[]
	return collections.map((collection) => ({ ...collection, images: [] })) as CollectionWithImages[]
}

export async function renameCollection(collectionId: string, newName: string) {
	const formData = new FormData()
	formData.set('name', newName)
	const response = await fetch(`${HOST}/collection/${collectionId}`, { method: 'PATCH', body: formData })
	if (!response.ok) {
		throw new Error('Failed to change name of the collection')
	}
}
