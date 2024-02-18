import { defineStore } from 'pinia'
import { CollectionWithImages } from '../model/Data'
import FuzzySearch from 'fuzzy-search'

const ID = 'collection_list'

interface State {
	list: CollectionWithImages[]
	filter: string
}

interface Actions {
	init(list: CollectionWithImages[]): void
}

interface Getters {
	filteredCollection(state: State): CollectionWithImages[]
}

//@ts-expect-error wtf
export const useCollectionList = defineStore<typeof ID, State, Getters, Actions>(ID, {
	state: (): State => ({ list: [], filter: '' }),

	actions: {
		init(list) {
			this.list = list
		},
	},

	getters: {
		filteredCollection(state) {
			const searcher = new FuzzySearch(state.list, ['name'], {
				caseSensitive: false,
				sort: true,
			})
			return searcher.search(state.filter.toLocaleLowerCase())
		},
	},
})
