// Drizzle migrations script - runs through github actions

import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'

async function main() {
	console.log('Connecting to database...')

	const pool = new Pool({
		connectionString: process.env.NUXT_DATABASE_URL,
		connectionTimeoutMillis: 10_000,
	})

	// Verify connection before attempting migrations
	try {
		const client = await pool.connect()
		console.log('✓ Yay! Database connection established')
		client.release()
	} catch (err) {
		console.error('✗ Fuck! Failed to connect to database:')
		console.error(err)
		process.exit(1)
	}

	const db = drizzle(pool)

	try {
		console.log('Running migrations...')
		await migrate(db, { migrationsFolder: './drizzle' })
		console.log('✓ Yay! Migrations complete')
	} catch (err) {
		console.error('✗ Fuck! Migration failed:')
		console.error(err)
		process.exit(1)
	} finally {
		await pool.end()
	}
}

main()
