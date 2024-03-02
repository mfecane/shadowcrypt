import { defineStore } from 'pinia'
import {
	User as FirebaseUser,
	GoogleAuthProvider,
	createUserWithEmailAndPassword,
	getAdditionalUserInfo,
	getAuth,
	onAuthStateChanged,
	sendPasswordResetEmail,
	signInWithEmailAndPassword,
	signInWithPopup,
	signOut,
	updatePassword,
} from 'firebase/auth'
import { auth, db, provider } from '@/firebase'
import { collection, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'

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
	message: string
	locked: boolean
}

interface Actions {
	showRegisterDialog(): void
	showLoginDialog(): void
	showForgotDialig(): void
	closeDialog(): void
	lock(): void
	unlock(): void
	setError(arr: string): void
	setMessage(message: string): Promise<void>
	setUser(user?: User | null): void
	clearMessages(): void
}

export const useAuth = defineStore<typeof ID, State, {}, Actions>(ID, {
	state: (): State => ({
		user: null,
		dialogType: null,
		error: '',
		message: '',
		locked: false,
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

		setMessage(message) {
			return new Promise((resolve) => {
				this.message = message
				setTimeout(() => {
					this.message = ''
					resolve()
				}, 5000)
			})
		},

		clearMessages() {
			this.error = ''
			this.message = ''
		},

		lock() {
			this.locked = true
		},

		unlock() {
			this.locked = false
		},
	},

	getters: {},
})

export async function useAuthWatcher() {
	const authStore = useAuth()
	onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
		if (user) {
			setUser(user)
		} else {
			authStore.setUser(null)
		}
		return user
	})
}

export async function register(userLogin: string, password: string, confirmation: string): Promise<boolean> {
	const authStore = useAuth()
	if (password === confirmation) {
		authStore.lock()
		try {
			let userCredential = await createUserWithEmailAndPassword(auth, userLogin, password)
			const id = userCredential.user.uid
			await setDoc(doc(collection(db, 'users'), id), {
				name: '',
			})
			const { user } = await signInWithEmailAndPassword(auth, userLogin, password)
			await authStore.setMessage('User successfully created')
			await setUser(user)
			return true
		} catch (error) {
			authStore.setError('Failed to create user')
		}
		authStore.unlock()
	} else {
		authStore.setError('Password and confirmation do not match')
	}
	return false
}

async function setUser(user: FirebaseUser) {
	const authStore = useAuth()
	try {
		const s = await getDoc(doc(db, 'users', user.uid))
		const userData = s.data()
		authStore.setUser({
			id: user.uid,
			email: user.email ?? '',
			...userData,
		})
	} catch (error) {
		console.error('Failed to read user', error)
	}
}

export async function login(userLogin: string, password: string): Promise<boolean> {
	const authStore = useAuth()
	let result: boolean
	try {
		authStore.lock()
		const { user } = await signInWithEmailAndPassword(auth, userLogin, password)
		await setUser(user)
		result = true
	} catch (error) {
		authStore.setError('Could not login with specified credentials')
		result = false
	}
	authStore.unlock()
	return result
}

export async function logout() {
	const authStore = useAuth()
	await signOut(auth)
	authStore.setUser(/* nobody */)
}

export async function updatePassword2(password: string) {
	const auth = getAuth()
	const authStore = useAuth()
	if (auth.currentUser) {
		try {
			authStore.lock()
			await updatePassword(auth.currentUser, password)
			await authStore.setMessage('Password successfully changed')
		} catch (error) {
			authStore.setError('Failed to update password')
		}
		authStore.unlock()
	}
}

export async function updateUser(name: string) {
	const auth = getAuth()
	const authStore = useAuth()
	if (auth.currentUser) {
		try {
			authStore.lock()
			const ref = doc(db, 'users', auth.currentUser.uid)
			await updateDoc(ref, { name })
			await authStore.setMessage('User data successfully changed')
			await setUser(auth.currentUser)
		} catch (error) {
			authStore.setError('Failed to update user')
		}
		authStore.unlock()
	}
}

export async function sendEmail(email: string) {
	const authStore = useAuth()
	authStore.lock()
	const auth = getAuth()
	await sendPasswordResetEmail(auth, email)
	await authStore.setMessage('Email with password reset link was sent')
	authStore.unlock()
}

export async function signInWithGluGlu(): Promise<boolean> {
	const authStore = useAuth()
	try {
		const result = await signInWithPopup(auth, provider)
		const credential = GoogleAuthProvider.credentialFromResult(result)
		if (!credential) {
			throw new Error('No credential')
		}
		const user = result.user
		const info = getAdditionalUserInfo(result)
		const id = user.uid
		await setDoc(doc(collection(db, 'users'), id), {
			name: info?.profile?.name ?? '',
		})
		await setUser(user)
		return true
	} catch (error) {
		authStore.setError('Failed to log in with google')
		return false
	}
}
