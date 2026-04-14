import { execSync } from 'node:child_process'

console.log('[build] env:', process.env.VERCEL_ENV ?? 'local')

try {
	console.log('[build] Building Zig WASM')
	execSync('npm run build:zig', { stdio: 'inherit' })
} catch (error) {
	console.error('[build] Building Zig WASM failed')
	throw error
}

try {
	console.log('[build] Building Nuxt app')
	execSync('npx nuxi build', { stdio: 'inherit' })
} catch (error) {
	console.error('[build] Building Nuxt app failed')
	throw error
}
