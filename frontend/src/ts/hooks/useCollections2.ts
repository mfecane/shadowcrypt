import { defineStore } from 'pinia'
import { CollectionWithImages } from '../model/Data'
import { getCollections, getImages } from '../api/collections'

const ID = 'collections3'

interface State {
	collections: CollectionWithImages[]
}

interface Actions {
	load(): Promise<void>
}

interface Getters {
	getById: (state: State) => (id: string) => CollectionWithImages | undefined
}

// TODO ???
//@ts-expect-error
export const useCollections2 = defineStore<typeof ID, State, Getters, Actions>(ID, {
	state: () => {
		return {
			collections: [],
		}
	},

	actions: {
		async load() {
			const collections = await getCollections()
			for (let i = 0; i < collections.length; ++i) {
				collections[i].images = await getImages(collections[i].id)
			}
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
