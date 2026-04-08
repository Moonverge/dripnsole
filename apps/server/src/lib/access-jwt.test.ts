import { randomUUID } from 'node:crypto'
import { describe, expect, it, beforeAll } from 'vitest'
import { parseServerEnv } from '@dripnsole/config'
import { SignJWT } from 'jose'
import Redis from 'ioredis-mock'
import { getJwtKeys } from './jwt-keys.js'
import { denyAccessJti, signAccessToken, verifyAccessToken } from './access-jwt.js'
import type { RedisClient } from '../redis/client.js'

describe('access JWT', () => {
  const env = parseServerEnv({
    NODE_ENV: 'test',
    DATABASE_URL: 'postgres://u:p@127.0.0.1:5432/t',
    ALLOWED_ORIGINS: 'http://localhost:3000',
  })
  let privateKey: Awaited<ReturnType<typeof getJwtKeys>>['privateKey']
  let publicKey: Awaited<ReturnType<typeof getJwtKeys>>['publicKey']
  let redis: RedisClient

  beforeAll(async () => {
    const keys = await getJwtKeys(env)
    privateKey = keys.privateKey
    publicKey = keys.publicKey
    redis = new Redis() as unknown as RedisClient
  })

  it('sign and verify round-trip succeeds', async () => {
    const { token, jti } = await signAccessToken(privateKey, 'user-1')
    const payload = await verifyAccessToken(publicKey, token, redis)
    expect(payload.sub).toBe('user-1')
    expect(payload.jti).toBe(jti)
    expect(payload.role).toBe('user')
  })

  it('tampered token fails verification', async () => {
    const { token } = await signAccessToken(privateKey, 'user-1')
    const broken = `${token.slice(0, -4)}xxxx`
    await expect(verifyAccessToken(publicKey, broken, redis)).rejects.toThrow()
  })

  it('expired token fails verification', async () => {
    const jti = randomUUID()
    const token = await new SignJWT({ role: 'user' })
      .setProtectedHeader({ alg: 'RS256' })
      .setSubject('user-1')
      .setJti(jti)
      .setIssuedAt()
      .setExpirationTime('1s')
      .sign(privateKey)
    await new Promise((r) => setTimeout(r, 1100))
    await expect(verifyAccessToken(publicKey, token, redis)).rejects.toThrow()
  })

  it('denied jti is rejected', async () => {
    const { token, jti } = await signAccessToken(privateKey, 'user-1')
    await denyAccessJti(redis, jti, 60)
    await expect(verifyAccessToken(publicKey, token, redis)).rejects.toThrow()
  })

  it('verifyAccessToken without redis skips deny list', async () => {
    const { token } = await signAccessToken(privateKey, 'user-2')
    const payload = await verifyAccessToken(publicKey, token, null)
    expect(payload.sub).toBe('user-2')
  })

  it('rejects token without jti claim', async () => {
    const token = await new SignJWT({ role: 'user' as const })
      .setProtectedHeader({ alg: 'RS256' })
      .setSubject('user-3')
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(privateKey)
    await expect(verifyAccessToken(publicKey, token, null)).rejects.toThrow()
  })

  it('denyAccessJti without redis is a no-op', async () => {
    await expect(denyAccessJti(null, 'any-jti', 10)).resolves.toBeUndefined()
  })
})
