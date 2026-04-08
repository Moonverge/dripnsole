import { Redis } from 'ioredis'
import type { ServerEnv } from '@dripnsole/config'

export type RedisClient = Redis

export function createRedis(env: ServerEnv): RedisClient | null {
  if (!env.REDIS_URL) {
    return null
  }
  return new Redis(env.REDIS_URL, { maxRetriesPerRequest: 2, lazyConnect: true })
}
