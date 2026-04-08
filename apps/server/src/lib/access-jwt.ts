import { randomUUID } from 'node:crypto'
import { SignJWT, jwtVerify, type KeyLike } from 'jose'
import type { RedisClient } from '../redis/client.js'

const ACCESS_TTL_SEC = 15 * 60

export type AccessPayload = { sub: string; role: 'user'; jti: string }

export async function signAccessToken(
  privateKey: KeyLike,
  userId: string,
): Promise<{ token: string; jti: string }> {
  const jti = randomUUID()
  const token = await new SignJWT({ role: 'user' as const })
    .setProtectedHeader({ alg: 'RS256' })
    .setSubject(userId)
    .setJti(jti)
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TTL_SEC}s`)
    .sign(privateKey)
  return { token, jti }
}

export async function verifyAccessToken(
  publicKey: KeyLike,
  token: string,
  redis: RedisClient | null,
): Promise<AccessPayload> {
  const { payload } = await jwtVerify(token, publicKey, { algorithms: ['RS256'] })
  const sub = typeof payload.sub === 'string' ? payload.sub : ''
  const jti = typeof payload.jti === 'string' ? payload.jti : ''
  if (!sub || !jti) {
    throw new Error('invalid_token')
  }
  if (redis) {
    const denied = await redis.get(`jwt:deny:${jti}`)
    if (denied) {
      throw new Error('invalid_token')
    }
  }
  return { sub, role: 'user', jti }
}

export async function denyAccessJti(
  redis: RedisClient | null,
  jti: string,
  ttlSec: number,
): Promise<void> {
  if (!redis) return
  await redis.set(`jwt:deny:${jti}`, '1', 'EX', ttlSec)
}
