import { Collection, fetchOneCollection, getCollectionById, resolvePath } from '@/model/CollectionsModel'
import { defineStore } from 'pinia'
import { getImageDimensions, nn } from '@/utils/utils'
import { useAuth } from './useAuth'

const ID = 'id'
let lastUpdatedOne = 0
const UPDATE_TIMEOUT_MSEC = 120_000

export const enum Orientation {
	vertical,
	horizontal,
}

interface State {
	collection: Collection | null
	images: {
		id: string
		src?: string
		width?: number
		height?: number
	}[]
	orientation: Orientation
	selected: string | null
	resetScale: number
	loading: boolean
	fullScreen: string | null
	resolved: boolean
}

interface Actions {
	init(collection: Collection): void

	resolveImage(id: string): Promise<void>

	changeOrientation(): void

	select(id?: string): void

	resetScale2(): void

	openFullscreen(id: string): void

	closeFullscreen(): void

	checkIfResolved(): void

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
		images: [],
		resolved: false,
	}),

	actions: {
		init(collection) {
			this.collection = collection
			this.images = collection.images.map((it) => ({
				id: it.id,
			}))
			this.resolved = false
		},

		async resolveImage(id) {
			const image = nn(this.images.find((it) => it.id === id))
			const path = nn(await resolvePath(id))
			const [width, height] = await getImageDimensions(path)
			image.width = width
			image.height = height
			image.src = path
			this.checkIfResolved()
		},

		checkIfResolved() {
			this.resolved = !this.images.some((it) => !it.src || it.width == undefined || it.height == undefined)
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

export async function fetch(collectionId: string, force: boolean = false, userId?: string): Promise<void> {
	try {
		if (!userId) {
			const { user } = useAuth()
			if (!user) {
				return
			}
			userId = user.id
		}
		const store = useCollectionViewer()
		store.loading = true
		if (force || Date.now() - lastUpdatedOne > UPDATE_TIMEOUT_MSEC) {
			await fetchOneCollection(userId, collectionId)
			lastUpdatedOne = Date.now()
		}
		store.init(await getCollectionById(collectionId))
		store.loading = false
	} catch (error) {
		console.error('error', error)
	}
}

// add async loading of images one by one

// TODO remove
export async function update(id: string): Promise<void> {
	await fetch(id)
}
