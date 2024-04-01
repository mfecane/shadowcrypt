import { STORAGE_URL, db, storage } from '@/firebase'
import { uploadImage } from '@/firebase/functions'
import { CollectionImage, ImageData } from '@/model/Data'
import { getImageDimensions, makeid } from '@/utils/utils'
import { Timestamp, addDoc, collection, deleteDoc, doc, getDoc, updateDoc } from 'firebase/firestore'
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { resizeImage } from '@/utils/resizeImage'
import { CollectionApiData } from '@/model/CollectionsModel'

const FOLDER = 'images'
const MAX_WIDTH = 1200
const MAX_HEIGHT = 1200

// won't work for free 😭
export async function createTmpImageFromUrl(imageUrl: string): Promise<string> {
	const {
		data: { path },
	} = await uploadImage({ url: imageUrl })
	return createTmpImageRecord(path)
}

export async function createTmpImageFromBlob(blob: Blob, userId: string, imageType: string): Promise<string> {
	const filename = generateFilename(imageType)
	const path = g(userId, filename)
	const imagesRef = ref(storage, path)
	await uploadBytes(imagesRef, blob, {
		contentType: imageType,
	})
	return createTmpImageRecord(path)
}

function generateFilename(imageType: string): string {
	const filename = makeid(32)
	switch (imageType) {
		case 'image/png':
			return `${filename}.png`
		case 'image/jpg':
		case 'image/jpeg':
			return `${filename}.jpg`
		case 'image/webp':
			return `${filename}.webp`
		default:
			throw new Error(`Image type ${imageType} is not supported`)
	}
}

export async function uploadFile(userId: string, file: File): Promise<string> {
	file = await resizeImage({
		file,
		width: MAX_WIDTH,
		height: MAX_HEIGHT,
		quality: 0.5,
	})
	const filename = generateFilename(file.type)
	const path = g(userId, filename)
	const imagesRef = ref(storage, path)
	await uploadBytes(imagesRef, await file.arrayBuffer(), {
		contentType: file.type,
	})
	return createTmpImageRecord(path)
}

//TODO do i really need this?
async function createTmpImageRecord(path: string): Promise<string> {
	const { id } = await addDoc(collection(db, 'tmp_images'), { path: path })
	return id
}

export async function getTmpImage(tmpImageId: string) {
	const { path } = (await getDoc(doc(db, 'tmp_images', tmpImageId))).data() as { path: string }
	return path
}

export async function assignTmpImageToCollection(collectionId: string, tmpImageId: string): Promise<void> {
	const path = await getTmpImage(tmpImageId)

	const r = doc(db, 'collections', collectionId)
	const cd = await getDoc(r)
	const cdd = cd.data() as CollectionApiData
	const images = [...(cdd.images ?? []), path]

	await updateDoc(doc(db, 'collections', collectionId), {
		images,
		updated: Timestamp.now(),
	})

	// discard tmp image record
	await deleteDoc(doc(db, 'tmp_images', tmpImageId))
}

export async function getTmpImageSource(tmpImageId: string) {
	const path = await getTmpImage(tmpImageId)
	return resolvePath(path)
}

export async function discardTmpImage(id: string): Promise<void> {
	try {
		const docRef = await getDoc(doc(db, 'tmp_images', id))
		const { path } = docRef.data() as ImageData
		const imagesRef = ref(storage, path)
		await deleteObject(imagesRef)
	} catch (error) {
		console.error(error)
		throw new Error(`Failed to delete image ${id}`)
	}
	// discard tmp image record
	await deleteDoc(doc(db, 'tmp_images', id))
}

export async function deleteImage(collectionId: string, id: string): Promise<void> {
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
		// console.log('index', index)
		images.splice(index, 1)
		// console.log('images', images)
		updateDoc(docRef, { images })
	} catch (error) {
		console.error('error', error)
	}
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

export async function resolveImage(collectionId: string, src: string): Promise<CollectionImage> {
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

export async function resolveImage2(collectionId: string, src: string): Promise<CollectionImage> {
	return {
		id: src,
		path: src,
		collectionId,
	}
}

function g(userId: string, filename: string): string {
	return `${FOLDER}/${userId}/${filename}`
}
