import { addDoc, collection } from 'firebase/firestore'
import { db } from './firebase.js'

export async function createImageRecord(path: string): Promise<{ id: string }> {
	const docRef = await addDoc(collection(db, 'images'), { path: path, tmp: true })
	return { id: docRef.id }
}
