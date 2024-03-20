import { CollectionData } from '@/api/collections'
import { db, storage } from '@/firebase'
import { deleteDoc, doc, getDoc } from 'firebase/firestore'
import { deleteObject, ref } from 'firebase/storage'
import { defineStore } from 'pinia'
import { fetch } from './useCollectionList'

const ID = 'dialogs'

interface State {
	editCollectionDialog: boolean

	deleteCollectionDialog: boolean

	deleteImageDialog: boolean

	collectionId: string | null

	imageId: string | null
}

interface Actions {
	deleteCollection(id: string): void

	editCollection(id: string): void

	deleteImage(collectionId: string, id: string): void

	clear(): void
}

/**
 * this is shit idea remove too many coupling with client code
 */

export const useDialogs = defineStore<typeof ID, State, {}, Actions>(ID, {
	state: (): State => ({
		editCollectionDialog: false,
		deleteCollectionDialog: false,
		deleteImageDialog: false,
		collectionId: null,
		imageId: null,
	}),

	actions: {
		editCollection(id) {
			this.editCollectionDialog = true
			this.collectionId = id
		},

		deleteCollection(id) {
			this.deleteCollectionDialog = true
			this.collectionId = id
		},

		deleteImage(collectionId, id) {
			this.deleteImageDialog = true
			this.collectionId = collectionId
			this.imageId = id
		},

		clear() {
			this.deleteCollectionDialog = false
			this.deleteImageDialog = false
			this.editCollectionDialog = false
			this.collectionId = null
			this.imageId = null
		},
	},

	getters: {},
})

export async function deleteCollection() {
	const dialogs = useDialogs()
	if (dialogs.collectionId) {
		await deleteCollectionById(dialogs.collectionId)
	}
	fetch()
}

export async function deleteCollectionById(id: string) {
	try {
		const ref2 = doc(db, 'collections', id)
		const doc2 = await getDoc(ref2)
		const data = doc2.data() as CollectionData
		if (data.images) {
			for (let src of data.images) {
				const imagesRef = ref(storage, src)
				try {
					await deleteObject(imagesRef)
					console.log(`Successfully deleted ${src}`)
				} catch {
					throw new Error(`Could not delete ${src}`)
				}
			}
		}
		await deleteDoc(ref2)
	} catch (error) {
		console.error(error)
		throw new Error(`Failed to delete collection with id ${id}`)
	}
}
