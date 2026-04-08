import { generateKeyPairSync } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { parseServerEnv } from '@dripnsole/config'
import type { ServerEnv } from '@dripnsole/config'
import { getJwtKeys } from './jwt-keys.js'

describe('getJwtKeys', () => {
  it('returns key pair in test without env PEMs', async () => {
    const env = parseServerEnv({
      NODE_ENV: 'test',
      DATABASE_URL: 'postgres://u:p@127.0.0.1:5432/t',
      ALLOWED_ORIGINS: 'http://localhost:3000',
    })
    const { privateKey, publicKey } = await getJwtKeys(env)
    expect(privateKey).toBeTruthy()
    expect(publicKey).toBeTruthy()
  })

  it('reuses generated dev keys on subsequent calls', async () => {
    const env = parseServerEnv({
      NODE_ENV: 'test',
      DATABASE_URL: 'postgres://u:p@127.0.0.1:5432/t',
      ALLOWED_ORIGINS: 'http://localhost:3000',
    })
    const a = await getJwtKeys(env)
    const b = await getJwtKeys(env)
    expect(a.privateKey).toBe(b.privateKey)
    expect(a.publicKey).toBe(b.publicKey)
  })

  it('loads keys from PEM env when provided', async () => {
    const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
    const pemPrivate = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString()
    const pemPublic = publicKey.export({ type: 'spki', format: 'pem' }).toString()
    const env = parseServerEnv({
      NODE_ENV: 'test',
      DATABASE_URL: 'postgres://u:p@127.0.0.1:5432/t',
      ALLOWED_ORIGINS: 'http://localhost:3000',
      JWT_ACCESS_PRIVATE_KEY_PEM: pemPrivate,
      JWT_ACCESS_PUBLIC_KEY_PEM: pemPublic,
    })
    const keys = await getJwtKeys(env)
    expect(keys.privateKey).toBeTruthy()
    expect(keys.publicKey).toBeTruthy()
  })

  it('throws in production when PEMs are missing', async () => {
    const env = {
      NODE_ENV: 'production' as const,
      DATABASE_URL: 'postgres://u:p@127.0.0.1:5432/t',
      ALLOWED_ORIGINS: ['http://localhost:3000'],
      FRONTEND_URL: 'http://localhost:3000',
    } as unknown as ServerEnv
    await expect(getJwtKeys(env)).rejects.toThrow('JWT access keys are required')
  })
})
