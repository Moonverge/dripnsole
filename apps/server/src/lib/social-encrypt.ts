import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto'
import type { ServerEnv } from '@dripnsole/config'

function keyBytes(env: ServerEnv): Buffer {
  if (!env.TOKEN_ENCRYPTION_KEY) {
    if (env.NODE_ENV === 'production') throw new Error('TOKEN_ENCRYPTION_KEY required')
    return scryptSync('dev-only-token-encryption', 'salt', 32)
  }
  return Buffer.from(env.TOKEN_ENCRYPTION_KEY, 'hex')
}

export function encryptSecret(env: ServerEnv, plaintext: string): string {
  const key = keyBytes(env)
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, enc]).toString('base64')
}

export function decryptSecret(env: ServerEnv, blob: string): string {
  const key = keyBytes(env)
  const raw = Buffer.from(blob, 'base64')
  const iv = raw.subarray(0, 12)
  const tag = raw.subarray(12, 28)
  const data = raw.subarray(28)
  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8')
}
