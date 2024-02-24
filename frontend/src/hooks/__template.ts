/* TEMPLATE */

import { defineStore } from 'pinia'

const ID = 'id'

interface State {}

interface Actions {}

export const useStore = defineStore<typeof ID, State, {}, Actions>(ID, {
	state: (): State => ({}),
	actions: {},
	getters: {},
})
