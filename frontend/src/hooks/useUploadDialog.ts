import { defineStore } from 'pinia'
import { discardTmpImage, createTmpImageFromBlob } from '@/api/images'
import { useAuth } from './useAuth'
import { Collection, createCollection, fetchAll, getCollections } from '@/model/CollectionsModel'

const ID = 'upload_dialog_store'

export enum Steps {
	upload_image,
	show_selector,
}

interface State {
	step: Steps
	showCreateModal: boolean
	imageId: string | null
	selectedCollection: string | null
	error: string | null
	collections: Collection[]
}

interface Actions {
	initCollectionsList(list: Collection[]): void

	showCreateDialog(): void

	setImageId(id: string | null): void

	closeDialog(): Promise<void>

	discardDialog(): Promise<void>

	setSelectedCollection(selectedCollection: string): void

	switchStep(): void

	reset(): void
}

interface Getters {
	getSelectedCollection(): Collection | null
}

//@ts-ignore fuck off
export const useUploadDialog = defineStore<typeof ID, State, Getters, Actions>(ID, {
	state: (): State => {
		return {
			step: Steps.upload_image,
			collections: [],
			showCreateModal: false,
			selectedCollection: null,
			imageId: null,
			error: '',
		}
	},

	actions: {
		reset() {
			this.step = Steps.upload_image
		},

		initCollectionsList(list) {
			this.collections = [...list]
			if (this.collections.length) {
				this.setSelectedCollection(this.collections[0].id)
			}
		},

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
			this.reset()
			this.closeDialog()
		},

		setSelectedCollection(selectedCollection) {
			this.selectedCollection = selectedCollection
		},

		switchStep() {
			if (this.step === Steps.show_selector) {
				this.step = Steps.upload_image
			}
			if (this.step === Steps.upload_image) {
				this.step = Steps.show_selector
			}
		},
	},

	getters: {
		getSelectedCollection() {
			if (!this.selectedCollection) {
				return null
			}
			const found = this.collections.find((c) => c.id === this.selectedCollection) ?? null
			if (!found) {
				throw new Error('Ermac')
			}
			return found
		},
	},
})

async function getImageFromClipboard(): Promise<[imageType: string, item: ClipboardItem] | null> {
	const clipboardItems = await navigator.clipboard.read()
	for (const clipboardItem of clipboardItems) {
		const imageTypes = clipboardItem.types.filter((type) => type.startsWith('image/'))
		if (!imageTypes) {
			continue
		}
		for (const imageType of imageTypes) {
			return [imageType, clipboardItem]
		}
	}
	return null
}

export async function checkClipboard() {
	const upload = useUploadDialog()
	const auth = useAuth()
	if (!auth.user) {
		return
	}
	const items = await getImageFromClipboard()
	if (!items) {
		return
	}
	const [imageType, item] = items
	const blob = await item.getType(imageType)
	const imageId = await createTmpImageFromBlob(blob, auth.user.id, imageType)
	upload.showCreateDialog()
	upload.setImageId(imageId)
}

export function listenPaste() {
	addEventListener('paste', async () => {
		await checkClipboard()
	})
}

export async function discardTmpImage2() {
	const upload = useUploadDialog()
	try {
		if (upload.imageId) {
			await discardTmpImage(upload.imageId)
			upload.imageId = null
		}
	} catch (error) {
		upload.error = 'Internal error: failed to delete temporary image'
		console.log('error', error)
		throw new Error(upload.error)
	}
}

export async function fetch(): Promise<void> {
	const store = useUploadDialog()
	const auth = useAuth()
	if (!auth.user) {
		throw 'User not authorised'
	}
	store.initCollectionsList(await getCollections(auth.user.id))
}

export async function createCollection2(value: string) {
	const auth = useAuth()
	const store = useUploadDialog()
	if (!auth.user) {
		throw 'User not authorised'
	}
	if (value) {
		const id = await createCollection(value, auth.user.id)
		await fetch()
		store.setSelectedCollection(id)
		store.step = Steps.upload_image
	}
}
