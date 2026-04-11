import type { ServerEnv } from '@dripnsole/config'
import type { KeyLike } from 'jose'
import type { RedisClient } from './redis/client.js'
import type { Db, Pool } from './db/client.js'

export type AppDeps = {
  env: ServerEnv
  db: Db
  pool: Pool
  redis: RedisClient | null
  jwtPrivate: KeyLike
  jwtPublic: KeyLike
}

declare module 'fastify' {
  interface FastifyInstance {
    deps: AppDeps
  }
  interface FastifyContextConfig {
    public?: boolean
    skipRateLimit?: boolean
    rateLimit?: { max: number; timeWindow: string | number }
  }
  interface FastifyRequest {
    userId?: string
    userRole?: 'buyer' | 'seller' | 'admin'
    requestId?: string
    emailVerified?: boolean
    accessJti?: string
  }
}
