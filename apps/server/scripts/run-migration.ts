import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'
import { config } from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '../../..')
config({ path: path.join(repoRoot, '.env') })

const url = process.env.DATABASE_URL
if (!url) {
  console.error('DATABASE_URL is required')
  process.exit(1)
}

const migrations = [
  { name: '0000_init', file: '0000_init.sql' },
  { name: '0001_roles', file: '0001_roles.sql' },
]

const client = new pg.Client({ connectionString: url })
await client.connect()
try {
  await client.query(`
    CREATE TABLE IF NOT EXISTS __migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)

  for (const migration of migrations) {
    const { rowCount } = await client.query(
      `SELECT 1 FROM __migrations WHERE name = $1`,
      [migration.name],
    )

    if (rowCount && rowCount > 0) {
      console.log(`Migration ${migration.name} already applied — skipping.`)
      continue
    }

    const sqlPath = path.join(__dirname, '../drizzle', migration.file)
    const sql = readFileSync(sqlPath, 'utf8')

    await client.query('BEGIN')
    try {
      await client.query(sql)
      await client.query(
        `INSERT INTO __migrations (name) VALUES ($1)`,
        [migration.name],
      )
      await client.query('COMMIT')
      console.log(`Migration ${migration.name} applied.`)
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    }
  }
} finally {
  await client.end()
}
