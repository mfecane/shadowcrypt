import { defineStore } from 'pinia'
import { discardTmpImage } from '@/api/images'

const ID = 'upload_dialog_store'

interface State {
	showCreateModal: boolean
	imageId: string | null
	selectedCollection: string | null
}

interface Actions {
	showCreateDialog(): void

	setImageId(id: string | null): void

	closeDialog(): Promise<void>

	discardDialog(): Promise<void>

	setSelectedCollection(selectedCollection: string): void
}

export const useUploadDialog = defineStore<typeof ID, State, {}, Actions>(ID, {
	state: (): State => {
		return {
			showCreateModal: false,
			selectedCollection: null,
			imageId: null,
		}
	},

	actions: {
		showCreateDialog() {
			this.imageId = null
			this.showCreateModal = true
		},

		setImageId(value) {
			this.imageId = value
		},

		async closeDialog() {
			this.showCreateModal = false
		},

		async discardDialog() {
			if (this.imageId) {
				await discardTmpImage(this.imageId)
				this.setImageId(null)
			}
			this.closeDialog()
		},

		setSelectedCollection(selectedCollection) {
			this.selectedCollection = selectedCollection
		},
	},

	getters: {},
})
