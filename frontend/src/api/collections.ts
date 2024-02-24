import { Timestamp, addDoc, collection, doc, getDocs, query, updateDoc, where } from 'firebase/firestore'
import { db } from '@/firebase'
import { Collection, CollectionImage, CollectionWithImages } from '@/model/Data'
import { getImageDimensions } from '../utils/utils'
import { resolvePath } from './images'

async function getCollections(userId: string): Promise<Collection[]> {
	const q = query(collection(db, 'collections'), where('user', '==', userId))
	const s = await getDocs(q)
	const d2: Collection[] = []
	s.forEach((d) => {
		let data = d.data() as Collection
		data = { ...data, id: d.id }
		d2.push(data)
	})
	return d2
}

export async function getCollectionsWithImages(userId: string): Promise<CollectionWithImages[]> {
	const collections = await getCollections(userId)
	const collections2: CollectionWithImages[] = []
	for (const c of collections) {
		const q = query(collection(db, 'images'), where('collectionId', '==', c.id))
		const s = await getDocs(q)
		const coll = c as CollectionWithImages
		coll.images = s.docs.map((i) => ({ ...i.data(), id: i.id } as CollectionImage))
		for (let i = 0; i < coll.images.length; ++i) {
			await resolveImage(coll.images[i])
		}
		collections2.push(coll)
	}
	return collections2
}

async function resolveImage(image: CollectionImage) {
	const p = image.path
	if (p) {
		image.path = (await resolvePath(p)) as string
	}
	const [width, height] = await getImageDimensions(image.path)
	image.width = width
	image.height = height
}

export async function createCollection(name: string, userId: string) {
	const docRef = await addDoc(collection(db, 'collections'), { name: name, user: userId, updated: Timestamp.now() })
	return docRef.id
}

export async function renameCollection(id: string, name: string) {
	await updateDoc(doc(db, 'collections', id), { name: name })
}
