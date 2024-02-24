import { FirebaseOptions, initializeApp } from 'firebase/app'
import { browserSessionPersistence, connectAuthEmulator, getAuth, setPersistence } from 'firebase/auth'
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore'
import { getStorage, connectStorageEmulator } from 'firebase/storage'
import { connectFunctionsEmulator, getFunctions, httpsCallable } from 'firebase/functions'

const config: FirebaseOptions = {
	apiKey: import.meta.env.PINC_API_KEY,
	authDomain: import.meta.env.PINC_AUTH_DOMAIN,
	projectId: import.meta.env.PINC_PROJECTID,
	storageBucket: import.meta.env.PINC_STORAGE_BUCKET,
	messagingSenderId: import.meta.env.PINC_MESSAGING_SENDER_ID,
	appId: import.meta.env.PINC_APP_ID,
}

const app = initializeApp(config)
export const db = getFirestore(app)
export const storage = getStorage(app)
export const functions = getFunctions(app)

export const auth = getAuth(app)
setPersistence(auth, browserSessionPersistence)

if (location.hostname === 'localhost') {
	connectFirestoreEmulator(db, 'localhost', 8083)
	connectStorageEmulator(storage, 'localhost', 9199)
	connectAuthEmulator(auth, 'http://localhost:9099')
	connectFunctionsEmulator(functions, 'localhost', 4501)
}

export const STORAGE_URL = 'http://localhost:9199/'
