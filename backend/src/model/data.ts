import { FieldValue } from 'firebase/firestore'

export interface CollectionImage {
	id: string
	path: string
	collectionId: string
	tmp: boolean
	created: FieldValue
}

export interface Collection {
	name: string
	updated: FieldValue
}
