import { createHash, randomBytes } from 'node:crypto'

export function newRefreshTokenRaw(): string {
  return randomBytes(48).toString('base64url')
}

export function hashRefreshToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex')
}
