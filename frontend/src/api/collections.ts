import { Timestamp, addDoc, collection, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore'
import { db } from '@/firebase'
import { CollectionImage, CollectionWithImages } from '@/model/Data'
import { resolveImage } from './images'
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

export async function getCollection(collectionId: string): Promise<CollectionData> {
	const dd = await getDoc(doc(db, 'collections', collectionId))
	return dd.data() as CollectionData
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
