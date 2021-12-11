import { createPinia } from 'pinia'
import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'

import '@/scss/null.scss'
import '@/scss/style.scss'

import App from '@/ts/components/App.vue'
import CollectionsList from '@/ts/components/CollectionsList.vue'
import Collection from '@/ts/components/Collection.vue'

const pinia = createPinia()
const app = createApp(App)

const routes = [
	{ path: '/', component: CollectionsList },
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
app.mount('#app')
