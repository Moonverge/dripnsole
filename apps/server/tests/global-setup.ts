import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'
import { PostgreSqlContainer } from '@testcontainers/postgresql'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const serverRoot = path.resolve(__dirname, '..')

let container: Awaited<ReturnType<PostgreSqlContainer['start']>> | null = null

async function applySchema(url: string, resetSchema: boolean) {
  const sqlPath = path.join(serverRoot, 'drizzle/0000_init.sql')
  const sql = readFileSync(sqlPath, 'utf8')
  const client = new pg.Client({ connectionString: url })
  await client.connect()
  try {
    if (resetSchema) {
      await client.query('DROP SCHEMA IF EXISTS public CASCADE')
      await client.query('CREATE SCHEMA public')
    }
    await client.query(sql)
  } finally {
    await client.end()
  }
}

export default async function globalSetup() {
  let url = process.env.TEST_DATABASE_URL?.trim() ?? ''
  let stopContainer: (() => Promise<void>) | undefined

  if (!url) {
    try {
      container = await new PostgreSqlContainer('postgres:16-alpine').start()
      url = container.getConnectionUri()
      stopContainer = async () => {
        await container?.stop()
        container = null
      }
      await applySchema(url, false)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      throw new Error(
        `Integration tests need Postgres. Either start Docker (Testcontainers) or set TEST_DATABASE_URL to a dedicated test database. Underlying: ${msg}`,
      )
    }
  } else {
    await applySchema(url, true)
  }

  process.env.TEST_DATABASE_URL = url
  process.env.DATABASE_URL = url

  return async () => {
    await stopContainer?.()
  }
}
