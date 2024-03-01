import { Timestamp, addDoc, collection, doc, getDocs, query, updateDoc, where } from 'firebase/firestore'
import { db } from '@/firebase'
import { CollectionImage, CollectionWithImages } from '@/model/Data'
import { getImageDimensions } from '../utils/utils'
import { resolvePath } from './images'
// import './utils/migrate1'

export interface CollectionData {
	name: string
	pinned: boolean
	updated: Timestamp
	images?: string[]
}

export async function getCollections(userId: string): Promise<CollectionWithImages[]> {
	const collectionsQuery = query(collection(db, 'collections'), where('user', '==', userId))
	const result: CollectionWithImages[] = []
	for (let document of (await getDocs(collectionsQuery)).docs) {
		const images: CollectionImage[] = []
		const data = document.data() as CollectionData
		const id = document.id
		for (let src of data.images ?? []) {
			images.push(await resolveImage(document.id, src))
		}
		const collectionData = {
			id,
			name: data.name,
			pinned: data.pinned,
			updated: data.updated,
			images,
		} as CollectionWithImages
		result.push(collectionData)
	}
	return result
}

async function resolveImage(collectionId: string, src: string): Promise<CollectionImage> {
	const path = (await resolvePath(src)) as string
	const [width, height] = await getImageDimensions(path)
	return {
		id: src,
		path: path,
		collectionId,
		width,
		height,
	}
}

export async function createCollection(name: string, userId: string) {
	const docRef = await addDoc(collection(db, 'collections'), {
		name: name,
		user: userId,
		updated: Timestamp.now(),
		images: [],
	})
	return docRef.id
}

export async function renameCollection(id: string, name: string) {
	await updateDoc(doc(db, 'collections', id), { name: name })
}
