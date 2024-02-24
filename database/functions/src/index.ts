import { onCall } from 'firebase-functions/v2/https'
import { fetchAndUpload } from './uploadImage'
import { info } from 'firebase-functions/logger'

export const uploadImage = onCall({ cors: ['http://localhost:5173'] }, async (request) => {
	const url = request.data.url as string
	info(`url: ${url}`)
	const path = await fetchAndUpload(url)
	info(`path: ${path}`)
	return { path }
})
