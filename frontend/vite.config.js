import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
	plugins: [vue()],
	resolve: {
		alias: [{ find: '@', replacement: '/src' }],
	},
	envPrefix: 'PINC_',
	server: {
		host: true,
		port: 5173,
	},
})
