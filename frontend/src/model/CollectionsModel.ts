import { STORAGE_URL, db, storage } from '@/firebase'
import { getImageDimensions, nn } from '@/utils/utils'
import { Timestamp, collection, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore'
import { getDownloadURL, ref } from 'firebase/storage'

interface CollectionApiData {
	name: string
	pinned: boolean
	updated: Timestamp
	images: string[]
}

export interface CollectionImage {
	id: string
	src: string
	width?: number
	height?: number
}

export interface Collection {
	id: string
	name: string
	pinned: boolean
	updated: Timestamp
	dimensionsResolved: boolean
	images: CollectionImage[]
}

export interface State {
	collections: Collection[]
}

const state: State = {
	collections: [],
}

export async function fetchAll(userId: string) {
	const collectionsQuery = query(collection(db, 'collections'), where('user', '==', userId))
	for (let document of (await getDocs(collectionsQuery)).docs) {
		const data = document.data() as CollectionApiData
		const id = document.id
		state.collections.push(await buildCollection(id, data))
	}
}

async function buildCollection(id: string, data: CollectionApiData): Promise<Collection> {
	const images: CollectionImage[] = []
	for (let src of data.images ?? []) {
		images.push(await resolveImageSrc(src))
	}
	return {
		id,
		name: data.name,
		pinned: data.pinned,
		updated: data.updated,
		images,
		dimensionsResolved: false,
	}
}

export async function fetchOneCollection(userId: string, collectionID: string) {
	if (!state.collections.length) {
		await fetchAll(userId)
		return
	}
	const dd = await getDoc(doc(db, 'collections', collectionID))
	const collection = await buildCollection(collectionID, dd.data() as CollectionApiData)
	const index = state.collections.findIndex((it) => it.id === collectionID)
	state.collections.splice(index, 1, collection)
}

export function getCollectionsList() {
	return state.collections
}

export async function getCollectionsById(collectionID: string) {
	const collection = nn(
		state.collections.find((it) => it.id === collectionID),
		`No collection with id = ${collectionID}`
	)
	await resolveImageDimensions(collection)
	return collection
}

export async function resolveImageSrc(src: string): Promise<CollectionImage> {
	return {
		id: src,
		src: (await resolvePath(src)) as string,
	}
}

async function resolveImageDimensions(collection: Collection) {
	if (collection.dimensionsResolved) {
		return
	}
	for (let img of collection.images) {
		const [width, height] = await getImageDimensions(img.src)
		img.width = width
		img.height = height
	}
	collection.dimensionsResolved = true
}

export async function resolvePath(path: string): Promise<string | null> {
	try {
		const imagesRef = ref(storage, path)
		let downloadUrl = ''
		try {
			downloadUrl = await getDownloadURL(imagesRef)
		} catch (error) {
			return null
		}
		downloadUrl = downloadUrl.replace(/http\:\/\/database\:9199\//, STORAGE_URL)
		return downloadUrl
	} catch (error) {
		console.error(`Failed to resolve path ${path}`)
		throw error
	}
}

export async function deleteImage(collectionId: string, id: string): Promise<void> {
	const collection = nn(
		state.collections.find((it) => it.id === collectionId),
		`No collection with id = ${collectionId}`
	)
	const index = collection.images.findIndex((it) => it.id === id)
	if (index === -1) {
		return
	}
	collection.images.splice(index, 1)
	await deleteImageApi(collectionId, id)
}

async function deleteImageApi(collectionId: string, id: string): Promise<void> {
	try {
		const docRef = doc(db, 'collections', collectionId)
		const docRef2 = await getDoc(docRef)
		let { images } = docRef2.data() as CollectionApiData
		if (!images || !images.length) {
			return
		}
		const index = images.findIndex((it) => it === id)
		if (index === -1) {
			return
		}
		images.splice(index, 1)
		updateDoc(docRef, { images })
	} catch (error) {
		console.error('error', error)
	}
}

export async function updateCollection(collectionId: string, name: string) {
	const coll = nn(
		state.collections.find((it) => it.id === collectionId),
		`No collection with id = ${collectionId}`
	)
	coll.name = name
	await updateCollectionApi(collectionId, name)
}

export async function updateCollectionApi(collectionId: string, name: string) {
	try {
		const docRef = doc(db, 'collections', collectionId)
		await updateDoc(docRef, { name })
	} catch (error) {
		throw error
	}
}
