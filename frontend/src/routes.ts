import App from '@/components/App.vue'
import Collection from '@/components/collection/Collection.vue'
import Home from './components/routes/Home.vue'
import Landing from './components/landing/Landing.vue'
import SignupPage from './components/landing/SignupPage.vue'
import SigninPage from './components/landing/SigninPage.vue'
import ForgotPage from './components/landing/ForgotPage.vue'
import UserSettingsPageVue from './components/pages/UserSettingsPage.vue'
import CollectionListPage from './components/pages/CollectionListPage.vue'

export const routes = [
	{
		path: '/',
		component: Home,
		meta: {
			title: 'Home',
		},
	},
	{
		path: '/landing',
		component: Landing,
		meta: {
			title: 'Home',
		},
	},
	{
		path: '/list',
		component: CollectionListPage,
		meta: {
			title: 'Collection list',
		},
	},
	{
		path: '/signup',
		component: SignupPage,
		meta: {
			title: 'Sign up',
		},
	},
	{
		path: '/signin',
		component: SigninPage,
		meta: {
			title: 'Sign in',
		},
	},
	{
		path: '/forgot',
		component: ForgotPage,
		meta: {
			title: 'Forgot password',
		},
	},
	{
		path: '/user',
		component: UserSettingsPageVue,
		meta: {
			title: 'User settings',
		},
	},
	{
		path: '/collections/:id',
		component: Collection,
		meta: {
			title: 'Collection',
		},
		props: true,
	},
]
