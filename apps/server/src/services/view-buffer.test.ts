import { describe, expect, it, beforeEach, vi } from 'vitest'
import type { Pool } from '../db/client.js'
import { eq } from 'drizzle-orm'
import { integrationContext, resetDatabase } from '../../tests/helpers/integration-context.js'
import {
  createListingWithAttachedPhoto,
  createStore,
  createVerifiedUser,
} from '../../tests/helpers/seed.js'
import { listings } from '../db/schema.js'
import { bumpView, flushViewsToDb } from './view-buffer.js'

describe('view-buffer', () => {
  beforeEach(resetDatabase)

  it('flushViewsToDb — redis bumps persist to listing view_count', async () => {
    const { app, pool, redis } = await integrationContext()
    const db = app.deps.db
    const { user } = await createVerifiedUser(db)
    const store = await createStore(db, user.id)
    const { listing } = await createListingWithAttachedPhoto(db, store.id, user.id)
    bumpView(redis, listing.id)
    bumpView(redis, listing.id)
    await flushViewsToDb(pool, redis)
    const [row] = await db.select().from(listings).where(eq(listings.id, listing.id)).limit(1)
    expect(row?.viewCount).toBeGreaterThanOrEqual(2)
  })
})

describe('view-buffer unit', () => {
  it('flushViewsToDb with redis and no view keys skips pool', async () => {
    const redis = { keys: vi.fn().mockResolvedValue([]) }
    const pool = { connect: vi.fn() }
    await flushViewsToDb(pool as unknown as Pool, redis as never)
    expect(pool.connect).not.toHaveBeenCalled()
  })

  it('bumpView swallows redis incr rejection', async () => {
    const redis = { incr: vi.fn().mockReturnValue(Promise.reject(new Error('unavailable'))) }
    bumpView(redis as never, 'aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee')
    await new Promise<void>((r) => setImmediate(r))
  })

  it('flushViewsToDb without redis persists pending counts', async () => {
    const queries: string[] = []
    const client = {
      async query(sql: string) {
        queries.push(sql)
      },
      release() {},
    }
    const pool = { connect: async () => client } as unknown as Pool
    bumpView(null, 'cccccccc-cccc-4ccc-cccc-cccccccccccc')
    bumpView(null, 'cccccccc-cccc-4ccc-cccc-cccccccccccc')
    await flushViewsToDb(pool, null)
    expect(queries.some((q) => q.includes('view_count'))).toBe(true)
    expect(queries.includes('COMMIT')).toBe(true)
  })

  it('flushViewsToDb redis path skips non-positive increments', async () => {
    const redis = {
      keys: vi.fn().mockResolvedValue(['views:dddddddd-dddd-4ddd-dddd-dddddddddddd']),
      get: vi.fn().mockResolvedValue('0'),
      del: vi.fn(),
    }
    const queries: string[] = []
    const client = {
      async query(sql: string) {
        queries.push(sql)
      },
      release() {},
    }
    const pool = { connect: async () => client } as unknown as Pool
    await flushViewsToDb(pool, redis as never)
    expect(queries.filter((q) => q.includes('view_count')).length).toBe(0)
  })

  it('flushViewsToDb redis path rolls back on update error', async () => {
    const redis = {
      keys: vi.fn().mockResolvedValue(['views:eeeeeeee-eeee-4eee-eeee-eeeeeeeeeeee']),
      get: vi.fn().mockResolvedValue('3'),
      del: vi.fn(),
    }
    const queries: string[] = []
    const client = {
      async query(sql: string) {
        queries.push(sql)
        if (sql === 'BEGIN') return
        if (sql.includes('view_count')) throw new Error('db')
      },
      release() {},
    }
    const pool = { connect: async () => client } as unknown as Pool
    await flushViewsToDb(pool, redis as never)
    expect(queries.includes('ROLLBACK')).toBe(true)
  })

  it('flushViewsToDb memory path rolls back on update error', async () => {
    const queries: string[] = []
    const client = {
      async query(sql: string) {
        queries.push(sql)
        if (sql === 'BEGIN') return
        if (sql.includes('view_count')) throw new Error('db')
      },
      release() {},
    }
    const pool = { connect: async () => client } as unknown as Pool
    bumpView(null, 'ffffffff-ffff-4fff-ffff-ffffffffffff')
    await flushViewsToDb(pool, null)
    expect(queries.includes('ROLLBACK')).toBe(true)
  })
})
