import { FirebaseOptions, initializeApp } from 'firebase/app'
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore'
import { getStorage, connectStorageEmulator } from 'firebase/storage'
import { config as envConfig } from 'dotenv'
import { getAuth } from 'firebase/auth'

envConfig()

const config: FirebaseOptions = {
	apiKey: process.env.PINC_API_KEY,
	authDomain: process.env.PINC_AUTH_DOMAIN,
	projectId: process.env.PINC_PROJECTID,
	storageBucket: process.env.PINC_STORAGE_BUCKET,
	messagingSenderId: process.env.PINC_MESSAGING_SENDER_ID,
	appId: process.env.PINC_APP_ID,
}

const app = initializeApp(config)
export const db = getFirestore(app)
export const storage = getStorage(app)

// TODO fix
if (true) {
	connectFirestoreEmulator(db, 'database', 8083)
	connectStorageEmulator(storage, 'database', 9199)
}
