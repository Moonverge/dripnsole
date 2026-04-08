import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'
import { config } from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '../..')
config({ path: path.join(repoRoot, '.env') })

const url = process.env.DATABASE_URL
if (!url) {
  console.error('DATABASE_URL is required')
  process.exit(1)
}

const sqlPath = path.join(__dirname, '../drizzle/0000_init.sql')
const sql = readFileSync(sqlPath, 'utf8')

const client = new pg.Client({ connectionString: url })
await client.connect()
try {
  await client.query(sql)
  console.log('Migration 0000_init applied.')
} finally {
  await client.end()
}
