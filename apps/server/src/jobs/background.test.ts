import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Pool } from '../db/client.js'
import { startBackgroundJobs, sweepExpiredReservations } from './background.js'

describe('sweepExpiredReservations', () => {
  it('marks expired reservations and frees listings', async () => {
    const queries: string[] = []
    const client = {
      async query(sql: string) {
        queries.push(sql)
        if (sql.includes('from reservations where status')) {
          return {
            rows: [
              {
                id: 'aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee',
                listing_id: 'bbbbbbbb-bbbb-4ccc-dddd-eeeeeeeeeeee',
              },
            ],
          }
        }
        return { rows: [] as { id: string }[] }
      },
      release() {},
    }
    const pool = {
      connect: async () => client,
    } as unknown as Pool
    await sweepExpiredReservations(pool)
    expect(queries.some((q) => q.includes("status = 'expired'"))).toBe(true)
    expect(queries.some((q) => q.includes("availability = 'available'"))).toBe(true)
  })
})

describe('startBackgroundJobs', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('runs sweep on interval and stop prevents further sweeps', async () => {
    vi.useFakeTimers()
    const queries: string[] = []
    const client = {
      async query(sql: string) {
        queries.push(sql)
        if (String(sql).includes('from reservations where status')) {
          return { rows: [] as { id: string; listing_id: string }[] }
        }
        return { rows: [] }
      },
      release() {},
    }
    const pool = { connect: async () => client } as unknown as Pool
    const stop = startBackgroundJobs({ pool, redis: null })
    await vi.advanceTimersByTimeAsync(60_000)
    await vi.advanceTimersByTimeAsync(5 * 60 * 1000)
    expect(queries.some((q) => q.includes('reservations'))).toBe(true)
    await vi.advanceTimersByTimeAsync(60 * 60 * 1000)
    expect(queries.some((q) => q.includes('listing_photos'))).toBe(true)
    const afterFirst = queries.length
    stop()
    await vi.advanceTimersByTimeAsync(5 * 60 * 1000)
    expect(queries.length).toBe(afterFirst)
  })
})
