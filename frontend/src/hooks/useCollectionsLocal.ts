import { defineStore } from 'pinia'
import { getCollectionsWithImages } from '../api/collections'
import { CollectionWithImages } from '../model/Data'
import { useAuth } from './useAuth'

const ID = 'collections_local'

interface State {
	collections: CollectionWithImages[]
}

interface Actions {
	init(collections: CollectionWithImages[]): void
}

interface Getters {
	getById: (state: State) => (id: string) => CollectionWithImages | undefined
}

// TODO ???
//@ts-expect-error
const useStore = defineStore<typeof ID, State, Getters, Actions>(ID, {
	state: (): State => ({ collections: [] }),

	actions: {
		init(collections) {
			this.collections = collections
		},
	},

	getters: {
		getById(state) {
			return (id) => {
				return state.collections.find((collection) => collection.id === id)
			}
		},
	},
})

export function useCollectionsLocal() {
	const store = useStore()

	const auth = useAuth()

	async function reloadCollections() {
		const id = auth.user?.id
		if (id) {
			store.init(await getCollectionsWithImages(id))
		} else {
			store.init([])
		}
	}

	return { store, reloadCollections }
}
