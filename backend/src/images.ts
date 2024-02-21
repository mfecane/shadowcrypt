import { fetchAndUpload, uploadImage } from './uploadImage.js'
import {
	Timestamp,
	collection,
	deleteDoc,
	doc,
	getDoc,
	getDocs,
	query,
	setDoc,
	updateDoc,
	where,
} from 'firebase/firestore'
import { db, storage } from './firebase.js'
import { ref, deleteObject, getDownloadURL } from 'firebase/storage'
import { UploadedFile } from 'express-fileupload'
import { Collection, CollectionImage } from './model/data.js'
import { STORAGE_URL } from './globals.js'
import { createImageRecord } from './firestore.js'

// TODO prune tmp images
export async function fetchAndAdd(url: string) {
	const path = await fetchAndUpload(url)
	return createImageRecord(path)
}

export async function addFile(file: UploadedFile) {
	const path = await uploadImage(file)
	return createImageRecord(path)
}

export async function discardTmpFile(id: string) {
	const docRef = await getDoc(doc(db, 'images', id))
	if (!docRef.exists()) {
		throw 'file does not exist'
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

export async function getImageUrl(id: string): Promise<string> {
	const docRef = await getDoc(doc(db, 'images', id))
	if (!docRef.exists()) {
		throw 'file does not exist'
	}
	return resolvePath(docRef.data().path)
}

async function resolvePath(path: string): Promise<string> {
	const imagesRef = ref(storage, path)
	let downloadUrl = await getDownloadURL(imagesRef)
	downloadUrl = downloadUrl.replace(/http\:\/\/database\:9199\//, STORAGE_URL)
	return downloadUrl
}

export async function createPin(imageId: string, collectionId: string) {
	const update: Partial<CollectionImage> = { collectionId, tmp: false, created: Timestamp.now() }
	await updateDoc(doc(db, 'images', imageId), update)
	const update2: Partial<Collection> = { updated: Timestamp.now() }
	// TODO BUG?

	// neither is working (((
	await setDoc(doc(db, 'collections', collectionId), update2, { merge: true })
	// await updateDoc(doc(db, 'collections', collectionId), update2)
}

export async function getImages(collectionId: string): Promise<CollectionImage[]> {
	const q1 = query(collection(db, 'images'), where('collectionId', '==', collectionId))
	const query1Snapshot = await getDocs(q1)
	const images: CollectionImage[] = []
	query1Snapshot.forEach((doc) => {
		const collectionImage = doc.data() as CollectionImage
		images.push({ ...collectionImage, id: doc.id })
	})
	await resolvePaths(images)
	return images
}

async function resolvePaths(images: CollectionImage[]): Promise<void> {
	for (let i = 0; i < images.length; ++i) {
		images[i].path = await resolvePath(images[i].path)
	}
}
