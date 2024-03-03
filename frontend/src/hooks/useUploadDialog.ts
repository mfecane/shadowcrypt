import { defineStore } from 'pinia'
import { discardTmpImage, createTmpImageFromBlob } from '@/api/images'
import { useAuth } from './useAuth'

const ID = 'upload_dialog_store'

interface State {
	showCreateModal: boolean
	imageId: string | null
	selectedCollection: string | null
	error: string | null
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
			error: '',
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
