/* TEMPLATE */

import { defineStore } from 'pinia'

const ID = 'quickfind'

interface State {
	showPopup: boolean
}

interface Actions {
	openPopup(): void
	closePopup(): void
}

export const useQuickfindStore = defineStore<typeof ID, State, {}, Actions>(ID, {
	state: (): State => ({ showPopup: false }),

	actions: {
		openPopup() {
			this.showPopup = true
		},
		closePopup() {
			this.showPopup = false
		},
	},

	getters: {},
})

function onKeyPress(event: KeyboardEvent) {
	const store = useQuickfindStore()

	if (event.key === 'p') {
		store.openPopup()
	}

	if (event.key === 'Escape') {
		store.closePopup()
	}
}

export function setupEvent() {
	document.body.addEventListener('keydown', onKeyPress)
}
