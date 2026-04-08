import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import type { ServerEnv } from '@dripnsole/config'
import * as schema from './schema.js'

export function createDbPool(env: ServerEnv) {
  const pool = new pg.Pool({ connectionString: env.DATABASE_URL, max: 20 })
  const db = drizzle(pool, { schema })
  return { pool, db }
}

export type Db = ReturnType<typeof createDbPool>['db']
export type Pool = ReturnType<typeof createDbPool>['pool']
