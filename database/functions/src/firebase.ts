import { cert, initializeApp } from 'firebase-admin/app'
import { getStorage } from 'firebase-admin/storage'

import json from '../pinpc-e9112-19ea27e0c20b.json'

export const app = initializeApp({
	credential: cert({
		projectId: json.project_id,
		clientEmail: json.client_email,
		privateKey: json.private_key,
	}),
	storageBucket: 'pinpc-e9112.appspot.com',
})

export const bucket = getStorage().bucket()

export const storage = getStorage(app)
