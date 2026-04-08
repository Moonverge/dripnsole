import type { RedisClient } from '../redis/client.js'
import type { Pool } from '../db/client.js'

const pending = new Map<string, number>()

export function bumpView(redis: RedisClient | null, listingId: string): void {
  if (redis) {
    void redis.incr(`views:${listingId}`).catch(() => {})
    return
  }
  pending.set(listingId, (pending.get(listingId) ?? 0) + 1)
}

export async function flushViewsToDb(pool: Pool, redis: RedisClient | null): Promise<void> {
  if (redis) {
    const keys = await redis.keys('views:*')
    if (keys.length === 0) return
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      for (const k of keys) {
        const n = await redis.get(k)
        const listingId = k.slice('views:'.length)
        const inc = Number(n || 0)
        if (inc <= 0) continue
        await client.query('update listings set view_count = view_count + $1 where id = $2::uuid', [
          inc,
          listingId,
        ])
        await redis.del(k)
      }
      await client.query('COMMIT')
    } catch {
      await client.query('ROLLBACK')
    } finally {
      client.release()
    }
    return
  }
  if (pending.size === 0) return
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    for (const [listingId, inc] of pending.entries()) {
      await client.query('update listings set view_count = view_count + $1 where id = $2::uuid', [
        inc,
        listingId,
      ])
    }
    pending.clear()
    await client.query('COMMIT')
  } catch {
    await client.query('ROLLBACK')
  } finally {
    client.release()
  }
}
