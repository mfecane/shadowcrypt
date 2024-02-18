import { Timestamp, addDoc, collection, getDocs, orderBy, query } from 'firebase/firestore'
import { db } from './firebase.js'

export interface Collection {
	id: string
	name: string
}

export async function getCollections(): Promise<Collection[]> {
	const q = query(collection(db, 'collections'), orderBy('updated', 'desc'))
	const snapshot = await getDocs(q)
	let collections: Collection[] = []
	snapshot.forEach((doc) => {
		const data = doc.data() as Collection
		collections.push({ ...data, id: doc.id })
	})
	return collections
}

export async function createCollection(name: string): Promise<string> {
	const docRef = await addDoc(collection(db, 'collections'), { name: name, updated: Timestamp.now() })
	return docRef.id
}
