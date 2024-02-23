import { defineStore, storeToRefs } from 'pinia'
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

	pinnedCollections(state: State): CollectionWithImages[]

	collectionExist(state: State): boolean

	firstRow(state: State): CollectionWithImages[]

	secondRow(state: State): CollectionWithImages[]
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

		collectionExist(state): boolean {
			return !!state.list.length
		},

		pinnedCollections(state) {
			return this.filteredCollection.filter((c) => c.pinned)
		},

		firstRow(state) {
			return this.filteredCollection.filter((c) => !c.pinned).slice(0, 3)
		},

		secondRow(state) {
			return this.filteredCollection.filter((c) => !c.pinned).slice(3)
		},
	},
})
