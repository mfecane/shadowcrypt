import { uploadBlob } from '@/api/images'
import { useUploadDialog } from './useUploadDialog'

export function usePaste() {
	const upload = useUploadDialog()

	addEventListener('paste', async () => {
		const clipboardItems = await navigator.clipboard.read()
		for (const clipboardItem of clipboardItems) {
			const imageTypes = clipboardItem.types.filter((type) => type.startsWith('image/'))
			if (!imageTypes) {
				return
			}
			for (const imageType of imageTypes) {
				const blob = await clipboardItem.getType(imageType)
				const imageId = await uploadBlob(blob, imageType)
				upload.showCreateDialog()
				upload.setImageId(imageId)
				return
			}
		}
	})
}
