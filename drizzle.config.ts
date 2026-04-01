import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = fileURLToPath(new URL('.', import.meta.url))
config({ path: resolve(rootDir, '.env') })
config({ path: resolve(rootDir, '.env.local') })

const databaseUrl = process.env.NUXT_DATABASE_URL
if (databaseUrl === undefined || databaseUrl === '') {
	throw new Error('NUXT_DATABASE_URL is not set (required for drizzle-kit)')
}

export default defineConfig({
	schema: './server/db/schema.ts',
	out: './drizzle',
	dialect: 'postgresql',
	dbCredentials: {
		url: databaseUrl,
	},
})
