import { describe, expect, it } from 'vitest'
import { parseServerEnv, type ServerEnv } from '@dripnsole/config'
import { decryptSecret, encryptSecret } from './social-encrypt.js'

const env = parseServerEnv({
  NODE_ENV: 'test',
  DATABASE_URL: 'postgres://u:p@127.0.0.1:5432/t',
  ALLOWED_ORIGINS: 'http://localhost:3000',
  TOKEN_ENCRYPTION_KEY: '0'.repeat(64),
})

describe('encryptSecret / decryptSecret', () => {
  it('ciphertext differs from plaintext', () => {
    const enc = encryptSecret(env, 'hello')
    expect(enc).not.toBe('hello')
  })

  it('round-trip restores value', () => {
    const enc = encryptSecret(env, 'token-abc')
    expect(decryptSecret(env, enc)).toBe('token-abc')
  })

  it('same plaintext yields different ciphertext', () => {
    const a = encryptSecret(env, 'x')
    const b = encryptSecret(env, 'x')
    expect(a).not.toBe(b)
    expect(decryptSecret(env, a)).toBe('x')
    expect(decryptSecret(env, b)).toBe('x')
  })

  it('derives dev key when TOKEN_ENCRYPTION_KEY is omitted in non-production', () => {
    const loose = parseServerEnv({
      NODE_ENV: 'test',
      DATABASE_URL: 'postgres://u:p@127.0.0.1:5432/t',
      ALLOWED_ORIGINS: 'http://localhost:3000',
    })
    const enc = encryptSecret(loose, 'secret')
    expect(decryptSecret(loose, enc)).toBe('secret')
  })

  it('requires TOKEN_ENCRYPTION_KEY in production', () => {
    const prod = { NODE_ENV: 'production' as const } as ServerEnv
    expect(() => encryptSecret(prod, 'x')).toThrow('TOKEN_ENCRYPTION_KEY required')
  })
})
