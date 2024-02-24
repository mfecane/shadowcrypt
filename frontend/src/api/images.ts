import { STORAGE_URL, db, storage } from '@/firebase'
import { uploadImage } from '@/firebase/functions'
import { Collection, CollectionImage } from '@/model/Data'
import { Timestamp, addDoc, collection, deleteDoc, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage'

const FOLDER = 'images'

export async function createImageFromUrl(imageUrl: string): Promise<string> {
	const result = await uploadImage({ url: imageUrl })
	return createImageRecord(result.data.path)
}

export async function uploadFile(file: File): Promise<string> {
	const buffer = Buffer.from(await file.arrayBuffer())
	const path = `${FOLDER}/${file.name}`
	const imagesRef = ref(storage, path)
	await uploadBytes(imagesRef, buffer)
	return createImageRecord(path)
}

async function createImageRecord(path: string): Promise<string> {
	const docRef = await addDoc(collection(db, 'images'), { path: path, tmp: true })
	return docRef.id
}

export async function discardLoadImage(id: string): Promise<void> {
	const docRef = await getDoc(doc(db, 'images', id))
	if (!docRef.exists()) {
		throw 'File does not exist'
	}
	const path = docRef.data().path
	const imagesRef = ref(storage, path)
	try {
		await deleteObject(imagesRef)
	} catch {
		throw 'Could not delete'
	}
	await deleteDoc(doc(db, 'images', id))
}

export async function createImage(imageId: string, collectionId: string): Promise<void> {
	const update: Partial<CollectionImage> = { collectionId, tmp: false, created: Timestamp.now() }
	await updateDoc(doc(db, 'images', imageId), update)
	const update2: Partial<Collection> = { updated: Timestamp.now() }
	// TODO BUG?
	// neither is working (((
	await setDoc(doc(db, 'collections', collectionId), update2, { merge: true })
	// await updateDoc(doc(db, 'collections', collectionId), update2)
}

export async function deleteImage(id: string): Promise<void> {
	await deleteDoc(doc(db, 'images', id))
}

export async function getImage(id: string): Promise<string | null> {
	const docRef = await getDoc(doc(db, 'images', id))
	if (!docRef.exists()) {
		throw 'file does not exist'
	}
	return resolvePath(docRef.data().path)
}

export async function resolvePath(path: string): Promise<string | null> {
	const imagesRef = ref(storage, path)
	let downloadUrl = ''
	try {
		downloadUrl = await getDownloadURL(imagesRef)
	} catch (error) {
		return null
	}
	downloadUrl = downloadUrl.replace(/http\:\/\/database\:9199\//, STORAGE_URL)
	return downloadUrl
}
