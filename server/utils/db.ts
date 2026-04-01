import { useRuntimeConfig } from '#imports'
import { drizzle } from 'drizzle-orm/node-postgres'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from '~~/server/db/schema'

let pool: Pool | null = null
let dbInstance: NodePgDatabase<typeof schema> | null = null

export function useDb(): NodePgDatabase<typeof schema> {
	if (dbInstance !== null) {
		return dbInstance
	}
	const config = useRuntimeConfig()
	const url = config.databaseUrl
	if (typeof url !== 'string' || url === '') {
		throw new Error('runtimeConfig.databaseUrl is not configured')
	}
	if (pool === null) {
		pool = new Pool({ connectionString: url })
	}
	dbInstance = drizzle(pool, { schema })
	return dbInstance
}
