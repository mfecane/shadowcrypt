import { Collection } from '../model/Data'
import { HOST } from './common'

export async function loadImage(src: string) {
	const params = {
		url: src,
	}
	const queryString = new URLSearchParams(params).toString()
	console.log('`${HOST}/upload?${queryString}`', `${HOST}/upload?${queryString}`)
	const res = await fetch(`${HOST}/upload?${queryString}`)

	console.log('res', await res.json())
}

export async function createCollection(name: string) {
	const response = await fetch(`http://localhost:3000/create-collection?name=${name}`)
	if (!response.ok) {
		throw new Error('Failed to create collection')
	}
}

export async function getCollections(): Promise<Collection[]> {
	const response = await fetch('http://localhost:3000/get-collections')
	return (await response.json()) as Collection[]
}

export async function getImage(id: string): Promise<string> {
	const params = new URLSearchParams([['id', id]])
	const response = await fetch(`${HOST}/get-image?${params}`)
	if (!response.ok) {
		throw new Error('Failed to get image')
	}
	return (await response.json()).url as string
}

export async function tryLoadImage(imageUrl: string): Promise<string> {
	// imageUrl = 'https://i.pinimg.com/564x/b2/fe/42/b2fe42de43adc9a4768961fa3cb3a1a9.jpg'
	const params = new URLSearchParams([['url', imageUrl]])
	const response = await fetch(`${HOST}/upload-image?${params}`)
	if (!response.ok) {
		throw new Error('Failed to upload image')
	}
	return (await response.json()).id as string
}

export async function discardLoadImage(id: string): Promise<void> {
	const params = new URLSearchParams([['id', id]])
	const response = await fetch(`${HOST}/discard-image?${params}`)
	if (!response.ok) {
		throw new Error('Failed to discard image')
	}
}

export async function uploadFile(file: File) {
	const formData = new FormData()
	formData.append('file', file)

	const response = await fetch(`${HOST}/upload-image-file`, { method: 'POST', body: formData })
	if (!response.ok) {
		throw new Error('Failed to upload image')
	}
	return (await response.json()).id as string
}

export async function createPin(imageId: string, collectionId: string) {
	const params = new URLSearchParams([
		['imageId', imageId],
		['collectionId', collectionId],
	])
	const response = await fetch(`${HOST}/create-pin?${params}`)
	if (!response.ok) {
		throw new Error('Failed to create pin')
	}
}
