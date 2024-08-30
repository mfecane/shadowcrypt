import { db } from '@/firebase'
import { collection, deleteDoc, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore'

async function migrate() {
	const q = query(collection(db, 'collections'), where('user', '==', 'fLD7Q6UUbb8qI1oyReMIzYXtawvO'))
	const s = await getDocs(q)
	for (let d of s.docs) {
		migrate2(d.id)
	}
}

async function migrate2(id: string) {
	const irq = query(collection(db, 'images'), where('collectionId', '==', id))
	const s = await getDocs(irq)
	const arr = []
	for (let d of s.docs) {
		arr.push(d.data().path)
		migrate3(d.id, d.data())
	}

	const ref = doc(db, 'collections', id)
	const d2 = await getDoc(ref)
	updateDoc(ref, { ...d2.data(), images: arr })
}

async function migrate3(id: string, data: any) {
	// console.log('id', id)
	// console.log('data', data)

	const ref = doc(db, 'images', id)
	deleteDoc(ref)
}

//@ts-ignore
globalThis.migrate = migrate
