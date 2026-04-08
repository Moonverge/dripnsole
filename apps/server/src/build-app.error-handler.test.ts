import { generateKeyPairSync } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import Redis from 'ioredis-mock'
import { parseServerEnv } from '@dripnsole/config'
import { buildApp } from './build-app.js'
import { HttpError } from './lib/http-error.js'
import { getJwtKeys } from './lib/jwt-keys.js'
import type { RedisClient } from './redis/client.js'

const hdr = { 'x-client-version': '1.0.0' }

describe('buildApp setErrorHandler', () => {
  it('hides error details when NODE_ENV is production', async () => {
    const url = process.env.TEST_DATABASE_URL
    expect(url).toBeTruthy()
    const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
    const pemPrivate = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString()
    const pemPublic = publicKey.export({ type: 'spki', format: 'pem' }).toString()
    const env = parseServerEnv({
      NODE_ENV: 'production',
      DATABASE_URL: url as string,
      ALLOWED_ORIGINS: 'http://localhost:3000',
      REDIS_URL: 'redis://127.0.0.1:6379',
      JWT_ACCESS_PRIVATE_KEY_PEM: pemPrivate,
      JWT_ACCESS_PUBLIC_KEY_PEM: pemPublic,
      TOKEN_ENCRYPTION_KEY: '0'.repeat(64),
    })
    const keys = await getJwtKeys(env)
    const redis = new Redis() as unknown as RedisClient
    const built = await buildApp({
      env,
      jwtPrivate: keys.privateKey,
      jwtPublic: keys.publicKey,
      redis,
    })
    await built.fastify.register(
      async (f) => {
        f.get('/__err', async () => {
          const e = new Error('internal-detail') as Error & { statusCode: number }
          e.statusCode = 500
          throw e
        })
      },
      { prefix: '/api' },
    )
    await built.fastify.ready()
    const res = await built.fastify.inject({ url: '/api/__err', headers: hdr })
    expect(res.statusCode).toBe(500)
    const body = JSON.parse(res.body) as { error: string; code: string }
    expect(body.error).toBe('Something went wrong')
    expect(body.code).toBe('INTERNAL')
    await built.fastify.close()
    await built.pool.end()
  })

  it('returns rate limit shape for thrown 429 errors', async () => {
    const url = process.env.TEST_DATABASE_URL as string
    const env = parseServerEnv({
      NODE_ENV: 'test',
      DATABASE_URL: url,
      ALLOWED_ORIGINS: 'http://localhost:3000',
    })
    const keys = await getJwtKeys(env)
    const built = await buildApp({
      env,
      jwtPrivate: keys.privateKey,
      jwtPublic: keys.publicKey,
      redis: null,
    })
    await built.fastify.register(
      async (f) => {
        f.get('/__429', async () => {
          const e = new Error('rl') as Error & { statusCode: number }
          e.statusCode = 429
          throw e
        })
      },
      { prefix: '/api' },
    )
    await built.fastify.ready()
    const res = await built.fastify.inject({ url: '/api/__429', headers: hdr })
    expect(res.statusCode).toBe(429)
    const body = JSON.parse(res.body) as { code: string }
    expect(body.code).toBe('RATE_LIMIT')
    await built.fastify.close()
    await built.pool.end()
  })

  it('serializes HttpError with headers', async () => {
    const url = process.env.TEST_DATABASE_URL as string
    const env = parseServerEnv({
      NODE_ENV: 'test',
      DATABASE_URL: url,
      ALLOWED_ORIGINS: 'http://localhost:3000',
    })
    const keys = await getJwtKeys(env)
    const built = await buildApp({
      env,
      jwtPrivate: keys.privateKey,
      jwtPublic: keys.publicKey,
      redis: null,
    })
    await built.fastify.register(
      async (f) => {
        f.get('/__http', () => {
          throw new HttpError(418, 'short and stout', 'TEAPOT', { 'x-tea': '1' })
        })
      },
      { prefix: '/api' },
    )
    await built.fastify.ready()
    const res = await built.fastify.inject({ url: '/api/__http', headers: hdr })
    expect(res.statusCode).toBe(418)
    expect(res.headers['x-tea']).toBe('1')
    const body = JSON.parse(res.body) as { code: string }
    expect(body.code).toBe('TEAPOT')
    await built.fastify.close()
    await built.pool.end()
  })

  it('surfaces Error.message in non-production', async () => {
    const url = process.env.TEST_DATABASE_URL as string
    const env = parseServerEnv({
      NODE_ENV: 'test',
      DATABASE_URL: url,
      ALLOWED_ORIGINS: 'http://localhost:3000',
    })
    const keys = await getJwtKeys(env)
    const built = await buildApp({
      env,
      jwtPrivate: keys.privateKey,
      jwtPublic: keys.publicKey,
      redis: null,
    })
    await built.fastify.register(
      async (f) => {
        f.get('/__vis', async () => {
          const e = new Error('debug-visible') as Error & { statusCode: number }
          e.statusCode = 502
          throw e
        })
      },
      { prefix: '/api' },
    )
    await built.fastify.ready()
    const res = await built.fastify.inject({ url: '/api/__vis', headers: hdr })
    expect(res.statusCode).toBe(502)
    const body = JSON.parse(res.body) as { error: string }
    expect(body.error).toBe('debug-visible')
    await built.fastify.close()
    await built.pool.end()
  })
})
