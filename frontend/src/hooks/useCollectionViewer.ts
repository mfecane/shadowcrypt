import { defineStore } from 'pinia'

const ID = 'id'

export const enum Orientation {
	vertical,
	horizontal,
}

interface State {
	orientation: Orientation
	selected: string | null
	resetScale: number
}

interface Actions {
	changeOrientation(): void

	select(id?: string): void

	resetScale2(): void
}

export const useCollectionViewer = defineStore<typeof ID, State, {}, Actions>(ID, {
	state: (): State => ({ orientation: Orientation.vertical, selected: null, resetScale: 0 }),

	actions: {
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
	},

	getters: {},
})
