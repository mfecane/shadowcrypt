import { defineStore } from 'pinia'
import {
	User as FirebaseUser,
	createUserWithEmailAndPassword,
	onAuthStateChanged,
	signInWithEmailAndPassword,
	signOut,
} from 'firebase/auth'
import { auth, db } from '@/firebase'
import { collection, doc, getDoc, setDoc } from 'firebase/firestore'

const ID = 'auth'

export enum LoginDialogType {
	Login,
	Register,
	Forgot,
}

export interface User {
	id: string
	email: string
	name?: string
}

interface State {
	user: User | null
	dialogType: LoginDialogType | null
	error: string
}

interface Actions {
	showRegisterDialog(): void
	showLoginDialog(): void
	showForgotDialig(): void
	closeDialog(): void
	setError(arr: string): void
	setUser(user?: User): void
}

export const useAuth = defineStore<typeof ID, State, {}, Actions>(ID, {
	state: (): State => ({
		user: null,
		dialogType: null,
		error: '',
	}),

	actions: {
		showRegisterDialog() {
			this.dialogType = LoginDialogType.Register
		},

		showLoginDialog() {
			this.dialogType = LoginDialogType.Login
		},

		showForgotDialig() {
			this.dialogType = LoginDialogType.Forgot
		},

		closeDialog() {
			this.dialogType = null
		},

		setError(error: string) {
			this.error = error
		},

		setUser(user) {
			this.closeDialog()
			if (user) {
				this.user = user
				return
			}
			this.user = null
		},
	},

	getters: {},
})

export async function useAuthWatcher() {
	onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
		if (user) {
			setUser(user)
		}
		return user
	})
}

export async function register(userLogin: string, password: string, confirmation: string) {
	const authStore = useAuth()
	if (password === confirmation) {
		let userCredential = await createUserWithEmailAndPassword(auth, userLogin, password)
		const id = userCredential.user.uid
		await setDoc(doc(collection(db, 'users'), id), {
			name: '',
		})
		const { user } = await signInWithEmailAndPassword(auth, userLogin, password)
		setUser(user)
	} else {
		authStore.setError('Password and confirmation do not match')
	}
}

async function setUser(user: FirebaseUser) {
	const authStore = useAuth()
	const s = await getDoc(doc(db, 'users', user.uid))
	const userData = s.data() as { name: string }
	authStore.setUser({
		id: user.uid,
		email: user.email ?? '',
		...userData,
	})
}

export async function login(userLogin: string, password: string) {
	const authStore = useAuth()
	try {
		const { user } = await signInWithEmailAndPassword(auth, userLogin, password)
		setUser(user)
	} catch (error) {
		//@ts-expect-error
		authStore.setError(error.toString())
	}
}

export async function logout() {
	const authStore = useAuth()
	signOut(auth)
	authStore.setUser()
}
