import { defineStore } from 'pinia'
import { createCollection, getCollections } from '@/ts/api/loader'
import { Collection } from '../model/Data'

interface State {
	collections: Collection[]
}

interface Actions {
	load(): Promise<void>
	createCollection(value: string): Promise<void>
	createPin(value: string): Promise<void>
}

export const useCollections = defineStore<'collections', State, {}, Actions>('collections', {
	state: () => {
		return {
			collections: [],
		}
	},

	actions: {
		async load() {
			this.collections = await getCollections()
		},

		async createCollection(value) {
			await createCollection(value)
			await this.load()

			// TODO select
		},

		async createPin(value) {},
	},

	getters: {},
})
