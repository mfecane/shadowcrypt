import { defineStore } from 'pinia'
import { discardLoadImage } from '../api/loader'

const ID = 'upload_dialog_store'

interface State {
	showCreateModal: boolean
	imageId: string | null
}

interface Actions {
	setShowCreateModal(value?: boolean): void

	showCreateDialog(): void

	setImageId(id: string | null): void

	closeDialog(): Promise<void>

	discardDialog(): Promise<void>
}

export const useUploadDialog = defineStore<typeof ID, State, {}, Actions>(ID, {
	state: (): State => {
		return {
			showCreateModal: false,
			imageId: null,
		}
	},

	actions: {
		setShowCreateModal(value) {
			if (value === undefined) {
				this.showCreateModal = !this.showCreateModal
				return
			}
			this.showCreateModal = value
		},

		showCreateDialog() {
			this.imageId = null
			this.showCreateModal = true
		},

		setImageId(value) {
			this.imageId = value
		},

		async closeDialog() {
			this.setShowCreateModal(false)
		},

		async discardDialog() {
			if (this.imageId) {
				await discardLoadImage(this.imageId)
				this.setImageId(null)
			}
			this.closeDialog()
		},
	},

	getters: {},
})
