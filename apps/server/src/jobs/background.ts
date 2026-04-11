import type { Pool } from '../db/client.js'
import type { RedisClient } from '../redis/client.js'
import { flushViewsToDb } from '../services/view-buffer.js'

export async function sweepExpiredReservations(pool: Pool): Promise<void> {
  const client = await pool.connect()
  try {
    const exp = await client.query(
      `select id, listing_id from reservations where status = 'pending' and expires_at < now()`,
    )
    for (const row of exp.rows as { id: string; listing_id: string }[]) {
      await client.query(`update reservations set status = 'expired' where id = $1::uuid`, [row.id])
      await client.query(
        `update listings set availability = 'available', updated_at = now() where id = $1::uuid and availability = 'reserved'`,
        [row.listing_id],
      )
    }
  } finally {
    client.release()
  }
}

export async function recalculateBadgeTiers(pool: Pool): Promise<void> {
  const client = await pool.connect()
  try {
    await client.query(`
      UPDATE stores SET badge = 'top', updated_at = now()
      WHERE completed_transactions >= 50
        AND CAST(rating AS NUMERIC) >= 4.5
        AND created_at <= now() - interval '90 days'
        AND badge != 'top'
    `)
    await client.query(`
      UPDATE stores SET badge = 'verified', updated_at = now()
      WHERE completed_transactions >= 10
        AND CAST(rating AS NUMERIC) >= 4.0
        AND badge = 'new'
    `)
  } finally {
    client.release()
  }
}

export function startBackgroundJobs(input: { pool: Pool; redis: RedisClient | null }): () => void {
  const tickViews = () => {
    void flushViewsToDb(input.pool, input.redis)
  }
  const tickOrphans = async () => {
    const client = await input.pool.connect()
    try {
      const r = await client.query(
        `delete from listing_photos where listing_id is null and created_at < now() - interval '1 hour' returning url`,
      )
      void r
    } finally {
      client.release()
    }
  }
  const v = setInterval(tickViews, 60_000)
  const r = setInterval(() => void sweepExpiredReservations(input.pool), 5 * 60_000)
  const o = setInterval(() => void tickOrphans(), 60 * 60_000)
  const b = setInterval(() => void recalculateBadgeTiers(input.pool), 24 * 60 * 60_000)
  return () => {
    clearInterval(v)
    clearInterval(r)
    clearInterval(o)
    clearInterval(b)
  }
}
