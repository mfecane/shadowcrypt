import { createPinia } from 'pinia'
import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import vueClickOutsideElement from 'vue-click-outside-element'

import '@/scss/null.scss'
import '@/scss/style.scss'

import App from '@/components/App.vue'
import CollectionsList from '@/components/list/CollectionsList.vue'
import Collection from '@/components/collection2/Collection.vue'
import Home from './components/routes/Home.vue'
import Landing from './components/landing/Landing.vue'

const pinia = createPinia()
const app = createApp(App)

const routes = [
	{ path: '/', component: Home },
	{
		path: '/landing',
		component: Landing,
	},
	{
		path: '/list',
		component: CollectionsList,
	},
	{
		path: '/collections/:id',
		component: Collection,
		props: true,
	},
]

const router = createRouter({
	history: createWebHashHistory(),
	routes,
})

app.use(pinia)
app.use(router)
app.use(vueClickOutsideElement)
app.mount('#app')
