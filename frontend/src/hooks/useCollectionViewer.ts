import { CollectionData, getCollection } from '@/api/collections'
import { resolveImage } from '@/api/images'
import { CollectionImage } from '@/model/Data'
import { defineStore } from 'pinia'

const ID = 'id'

export const enum Orientation {
	vertical,
	horizontal,
}

interface State {
	id: string
	name: string
	images: CollectionImage[]
	orientation: Orientation
	selected: string | null
	resetScale: number
	loading: boolean
	fullScreen: string | null
}

interface Actions {
	setCollectionData(id: string, collectionData: CollectionData): void

	changeOrientation(): void

	select(id?: string): void

	resetScale2(): void

	setImages(list: CollectionImage[]): void

	openFullscreen(id: string): void

	closeFullscreen(): void
}

export const useCollectionViewer = defineStore<typeof ID, State, {}, Actions>(ID, {
	state: (): State => ({
		id: '',
		name: '',
		images: [],
		orientation: Orientation.vertical,
		selected: null,
		resetScale: 0,
		loading: true,
		fullScreen: null,
	}),

	actions: {
		setCollectionData(id, collectionData) {
			this.id = id
			this.name = collectionData.name
			this.images = []
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

		setImages(list) {
			this.images = [...list]
		},

		openFullscreen(id: string) {
			this.fullScreen = id
		},

		closeFullscreen() {
			this.fullScreen = null
		},
	},

	getters: {},
})

export async function fetch(id: string): Promise<void> {
	const store = useCollectionViewer()
	store.loading = true
	const collectionData = await getCollection(id)
	store.setCollectionData(id, collectionData)
	const images: CollectionImage[] = []
	if (collectionData.images) {
		for (let i = 0; i < collectionData.images.length; ++i) {
			images.push(await resolveImage(id, collectionData.images[i]))
		}
	}
	store.setImages(images)
	store.loading = false
}
