import { Collection, fetchAll, getCollections } from '@/model/CollectionsModel'
import { defineStore } from 'pinia'
import { useAuth } from './useAuth'

const ID = 'collection_selector'

interface State {
	collections: Collection[]
}

interface Actions {
	init(list: Collection[]): void
}

export const useCollectionSelector = defineStore<typeof ID, State, {}, Actions>(ID, {
	state: (): State => ({
		collections: [],
	}),

	actions: {
		init(list) {
			this.collections = [...list]
		},
	},

	getters: {},
})

export async function fetch(): Promise<void> {
	const store = useCollectionSelector()
	const auth = useAuth()
	if (!auth.user) {
		throw 'User not authorised'
	}
	store.init(await getCollections(auth.user.id))
}
