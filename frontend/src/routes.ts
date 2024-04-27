import Landing from '@/components/landing/Landing.vue'
import HomePage from '@/components/pages/HomePage.vue'
import SignupPage from '@/components/pages/SignupPage.vue'
import SigninPage from '@/components/pages/SigninPage.vue'
import ForgotPage from '@/components/pages/ForgotPage.vue'
import UserSettingsPage from '@/components/pages/UserSettingsPage.vue'
import CollectionListPage from '@/components/pages/CollectionListPage.vue'
import CollectionViewPage from '@/components/pages/CollectionViewPage.vue'

export const routes = [
	{
		path: '/',
		component: HomePage,
		meta: {
			title: 'Shadowcrypt',
		},
	},
	{
		path: '/landing',
		component: Landing,
		meta: {
			title: 'Shadowcrypt',
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
		component: UserSettingsPage,
		meta: {
			title: 'User settings',
		},
	},
	{
		path: '/collections/:id',
		component: CollectionViewPage,
		meta: {
			title: 'Collection',
		},
		props: true,
	},
]
