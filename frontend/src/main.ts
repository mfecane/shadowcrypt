import { createPinia } from 'pinia'
import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import vueClickOutsideElement from 'vue-click-outside-element'
import { routes } from '@/routes'

import '@/scss/null.scss'
import '@/scss/style.scss'

import App from '@/components/App.vue'

const pinia = createPinia()
const app = createApp(App)

const router = createRouter({
	history: createWebHashHistory(),
	routes,
})

router.beforeEach((to, from) => {
	document.title = (to.meta?.title ?? 'Shadowcrypt') as string
})

app.use(pinia)
app.use(router)
app.use(vueClickOutsideElement)
app.mount('#app')
