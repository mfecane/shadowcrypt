import { Collection, fetchOneCollection, getCollectionsById } from '@/model/CollectionsModel'
import { defineStore } from 'pinia'
import { nn } from '@/utils/utils'

const ID = 'id'

export const enum Orientation {
	vertical,
	horizontal,
}

interface State {
	collection: Collection | null
	orientation: Orientation
	selected: string | null
	resetScale: number
	loading: boolean
	fullScreen: string | null
}

interface Actions {
	init(collection: Collection): void

	changeOrientation(): void

	select(id?: string): void

	resetScale2(): void

	openFullscreen(id: string): void

	closeFullscreen(): void

	clear(): void
}

interface Getters {
	requireCollection(state: State): Collection
}

//@ts-expect-error
export const useCollectionViewer = defineStore<typeof ID, State, Getters, Actions>(ID, {
	state: (): State => ({
		collection: null,
		orientation: Orientation.vertical,
		selected: null,
		resetScale: 0,
		loading: true,
		fullScreen: null,
	}),

	actions: {
		init(collection) {
			this.collection = collection
		},

		changeOrientation() {
			this.orientation = this.orientation === Orientation.horizontal ? Orientation.vertical : Orientation.horizontal
		},

		select(id) {
			if (id) {
				this.selected = id
				return
			}
			this.selected = null
		},

		resetScale2() {
			this.resetScale++
		},

		openFullscreen(id: string) {
			this.fullScreen = id
		},

		closeFullscreen() {
			this.fullScreen = null
		},

		clear() {
			this.collection = null
			this.selected = null
			this.resetScale = 0
			this.loading = true
			this.fullScreen = null
		},
	},

	getters: {
		requireCollection(state) {
			return nn(state.collection, `No collection is loaded`)
		},
	},
})

export async function fetch(userId: string, id: string): Promise<void> {
	const store = useCollectionViewer()
	store.loading = true
	await fetchOneCollection(userId, id)
	store.init(await getCollectionsById(id))
	store.loading = false
}

export async function update(id: string): Promise<void> {
	const store = useCollectionViewer()
	store.clear()
	store.loading = true
	store.init(await getCollectionsById(id))
	store.loading = false
}
