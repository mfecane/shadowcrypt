import { STORAGE_URL, db, storage } from '@/firebase'
import { uploadImage } from '@/firebase/functions'
import { Collection, CollectionImage } from '@/model/Data'
import { makeid } from '@/utils/utils'
import { Timestamp, addDoc, collection, deleteDoc, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage'

const FOLDER = 'images'

// won't work for free
export async function createImageFromUrl(imageUrl: string): Promise<string> {
	const result = await uploadImage({ url: imageUrl })
	return createImageRecord(result.data.path)
}

export async function uploadBlob(blob: Blob, imageType: string): Promise<string> {
	const filename = generateFilename(imageType)
	const path = `${FOLDER}/${filename}`
	const imagesRef = ref(storage, path)
	await uploadBytes(imagesRef, blob, {
		contentType: imageType,
	})
	return createImageRecord(path)
}

function generateFilename(imageType: string): string {
	const filename = makeid(32)
	switch (imageType) {
		case 'image/png':
			return `${filename}.png`
		case 'image/jpeg':
			return `${filename}.jpg`
		default:
			throw new Error(`Image type ${imageType} is not supported`)
	}
}

export async function uploadFile(file: File): Promise<string> {
	const path = `${FOLDER}/${file.name}`
	const imagesRef = ref(storage, path)
	await uploadBytes(imagesRef, await file.arrayBuffer(), {
		contentType: file.type,
	})
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
