import { httpsCallable } from 'firebase/functions'
import { functions } from '.'

export const uploadImage = httpsCallable<{ url: string }, { path: string }>(functions, 'uploadImage')
