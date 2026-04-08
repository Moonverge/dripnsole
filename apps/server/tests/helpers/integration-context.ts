import type { FastifyInstance } from 'fastify'
import type { KeyLike } from 'jose'
import Redis from 'ioredis-mock'
import { parseServerEnv } from '@dripnsole/config'
import { buildApp } from '../../src/build-app.js'
import type { Pool } from '../../src/db/client.js'
import { getJwtKeys } from '../../src/lib/jwt-keys.js'
import type { RedisClient } from '../../src/redis/client.js'

export type TestAppContext = {
  app: FastifyInstance
  pool: Pool
  redis: RedisClient
  jwtPrivate: KeyLike
  jwtPublic: KeyLike
}

let cached: TestAppContext | null = null

export async function integrationContext(): Promise<TestAppContext> {
  if (cached) return cached
  const url = process.env.TEST_DATABASE_URL
  if (!url) {
    throw new Error('TEST_DATABASE_URL is not set (run vitest with globalSetup)')
  }
  const redis = new Redis() as unknown as RedisClient
  const env = parseServerEnv({
    NODE_ENV: 'test',
    DATABASE_URL: url,
    ALLOWED_ORIGINS: 'http://localhost:3000',
    APP_VERSION: 'test',
    CDN_BASE_URL: 'https://cdn.example.com',
    CDN_DOMAIN: 'cdn.example.com',
    CLOUDFLARE_R2_BUCKET: 'test-bucket',
    CLOUDFLARE_R2_ENDPOINT: 'https://r2.example.com',
    CLOUDFLARE_R2_ACCESS_KEY: 'test-key',
    CLOUDFLARE_R2_SECRET_KEY: 'test-secret',
    TOKEN_ENCRYPTION_KEY: '0123456789abcdef'.repeat(4),
  })
  const keys = await getJwtKeys(env)
  const built = await buildApp({
    env,
    jwtPrivate: keys.privateKey,
    jwtPublic: keys.publicKey,
    redis,
  })
  await built.fastify.ready()
  cached = {
    app: built.fastify,
    pool: built.pool,
    redis,
    jwtPrivate: keys.privateKey,
    jwtPublic: keys.publicKey,
  }
  return cached
}

export async function resetDatabase(): Promise<void> {
  const { pool, redis } = await integrationContext()
  await pool.query('TRUNCATE TABLE users RESTART IDENTITY CASCADE')
  await redis.flushall()
}

export const ORIGIN_ALLOWED = 'http://localhost:3000'
export const CLIENT_VERSION = '1.0.0'

export function protectedHeaders(accessToken: string): Record<string, string> {
  return {
    authorization: `Bearer ${accessToken}`,
    'x-client-version': CLIENT_VERSION,
    origin: ORIGIN_ALLOWED,
  }
}
