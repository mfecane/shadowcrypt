import { defineStore, storeToRefs } from 'pinia'
import { CollectionImage, CollectionWithImages } from '../model/Data'
import FuzzySearch from 'fuzzy-search'
import { collection, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore'
import { db } from '@/firebase'
import { resolveImage2 } from '@/api/images'
import { useAuth } from './useAuth'
import { CollectionApiData, fetchAll } from '@/model/CollectionsModel'

const ID = 'collection_list'

interface State {
	list: CollectionWithImages[]
	filter: string
	loading: boolean
}

interface Actions {
	init(list: CollectionWithImages[]): void
}

interface Getters {
	filteredCollection(state: State): CollectionWithImages[]

	pinnedCollections(state: State): CollectionWithImages[]

	collectionExist(state: State): boolean

	firstRow(state: State): CollectionWithImages[]

	secondRow(state: State): CollectionWithImages[]
}

//@ts-expect-error wtf
export const useCollectionList = defineStore<typeof ID, State, Getters, Actions>(ID, {
	state: (): State => ({ list: [], filter: '', loading: false }),

	actions: {
		init(list) {
			this.list = list
		},
	},

	getters: {
		collectionExist(state): boolean {
			return !!state.list.length
		},

		pinnedCollections(state) {
			if (state.filter) {
				return []
			}
			return state.list.filter((c) => c.pinned)
		},

		firstRow(state) {
			if (state.filter) {
				return []
			}
			return state.list.filter((c) => !c.pinned).slice(0, 3)
		},

		secondRow(state) {
			if (state.filter) {
				return []
			}
			return state.list.filter((c) => !c.pinned).slice(3)
		},

		filteredCollection(state) {
			if (!state.filter) {
				return []
			}

			const searcher = new FuzzySearch(state.list, ['name'], {
				caseSensitive: false,
				sort: true,
			})
			return searcher.search(state.filter.toLocaleLowerCase())
		},
	},
})

export async function fetch(): Promise<void> {
	const store = useCollectionList()
	const auth = useAuth()
	store.loading = true
	if (!auth.user) {
		throw 'User not authorised'
	}
	const q = query(collection(db, 'collections'), where('user', '==', auth.user.id))
	const { docs } = await getDocs(q)
	const collecions: CollectionWithImages[] = []
	for (const coll of docs) {
		const id = coll.id
		const data = coll.data() as CollectionApiData
		const newImages: CollectionImage[] = []
		if (data.images) {
			for (let path of data.images) {
				newImages.push(await resolveImage2(coll.id, path))
			}
		}
		collecions.push({ id, ...data, images: newImages })
	}
	store.loading = false
	store.init(collecions)
	// TODO remove
	fetchAll(auth.user.id)
}

export async function pinCollection(collectionId: string): Promise<void> {
	try {
		const docRef = doc(db, 'collections', collectionId)
		const dod = await getDoc(docRef)
		const { pinned } = dod.data() as CollectionApiData
		await updateDoc(docRef, { pinned: !pinned })
	} catch (error) {
		throw error
	}
	fetch()
}

export function getCollection(collectionId: string): CollectionWithImages {
	const store = useCollectionList()
	const collection = store.list.find((it) => it.id === collectionId)
	if (!collection) {
		throw new Error('No collection')
	}
	return collection
}

export async function updateCollection(collectionId: string, name: string) {
	try {
		const docRef = doc(db, 'collections', collectionId)
		await updateDoc(docRef, { name })
	} catch (error) {
		throw error
	}
	await fetch()
}
