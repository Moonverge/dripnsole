import type { RedisClient } from '../redis/client.js'

type MemoryEntry = { count: number; resetAt: number }

const memEmail = new Map<string, MemoryEntry>()
const memIp = new Map<string, MemoryEntry>()
const memLockEmail = new Map<string, number>()
const memBlockIp = new Map<string, number>()

function memIncr(map: Map<string, MemoryEntry>, key: string, windowMs: number): number {
  const now = Date.now()
  const cur = map.get(key)
  if (!cur || cur.resetAt <= now) {
    map.set(key, { count: 1, resetAt: now + windowMs })
    return 1
  }
  cur.count += 1
  return cur.count
}

export async function recordFailedLogin(
  redis: RedisClient | null,
  ip: string,
  emailKey: string,
): Promise<{ emailLockedSec: number; ipBlockedSec: number; failuresForEmail: number }> {
  const windowMs = 15 * 60 * 1000
  if (redis) {
    const ek = `bf:email:${emailKey}`
    const ik = `bf:ip:${ip}`
    const pipe = redis.multi()
    pipe.incr(ek)
    pipe.expire(ek, 900)
    pipe.incr(ik)
    pipe.expire(ik, 900)
    const res = await pipe.exec()
    const emailFails = Number(res?.[0]?.[1] ?? 0)
    const ipFails = Number(res?.[2]?.[1] ?? 0)
    let emailLockedSec = 0
    if (emailFails >= 5) {
      await redis.set(`bf:lock:${emailKey}`, '1', 'EX', 900)
    }
    const lockTtl = await redis.ttl(`bf:lock:${emailKey}`)
    if (lockTtl > 0) emailLockedSec = lockTtl
    let ipBlockedSec = 0
    if (ipFails >= 20) {
      await redis.set(`bf:block:${ip}`, '1', 'EX', 3600)
    }
    const blockTtl = await redis.ttl(`bf:block:${ip}`)
    if (blockTtl > 0) ipBlockedSec = blockTtl
    return { emailLockedSec, ipBlockedSec, failuresForEmail: emailFails }
  }
  const emailFails = memIncr(memEmail, emailKey, windowMs)
  const ipFails = memIncr(memIp, ip, windowMs)
  let emailLockedSec = 0
  if (emailFails >= 5) {
    memLockEmail.set(emailKey, Date.now() + 900_000)
  }
  const lockUntil = memLockEmail.get(emailKey)
  if (lockUntil && lockUntil > Date.now()) {
    emailLockedSec = Math.ceil((lockUntil - Date.now()) / 1000)
  }
  let ipBlockedSec = 0
  if (ipFails >= 20) {
    memBlockIp.set(ip, Date.now() + 3600_000)
  }
  const blockUntil = memBlockIp.get(ip)
  if (blockUntil && blockUntil > Date.now()) {
    ipBlockedSec = Math.ceil((blockUntil - Date.now()) / 1000)
  }
  return { emailLockedSec, ipBlockedSec, failuresForEmail: emailFails }
}

export async function clearFailedLogin(
  redis: RedisClient | null,
  ip: string,
  emailKey: string,
): Promise<void> {
  if (redis) {
    await redis.del(`bf:email:${emailKey}`, `bf:ip:${ip}`)
    return
  }
  memEmail.delete(emailKey)
  memIp.delete(ip)
}

export async function isEmailLocked(redis: RedisClient | null, emailKey: string): Promise<number> {
  if (redis) {
    const t = await redis.ttl(`bf:lock:${emailKey}`)
    return t > 0 ? t : 0
  }
  const until = memLockEmail.get(emailKey)
  if (!until || until <= Date.now()) return 0
  return Math.ceil((until - Date.now()) / 1000)
}

export async function isIpBlocked(redis: RedisClient | null, ip: string): Promise<number> {
  if (redis) {
    const t = await redis.ttl(`bf:block:${ip}`)
    return t > 0 ? t : 0
  }
  const until = memBlockIp.get(ip)
  if (!until || until <= Date.now()) return 0
  return Math.ceil((until - Date.now()) / 1000)
}

export function emailKeyForBrute(email: string): string {
  return email.trim().toLowerCase()
}

export async function getEmailFailureCount(
  redis: RedisClient | null,
  emailKey: string,
): Promise<number> {
  if (redis) {
    const v = await redis.get(`bf:email:${emailKey}`)
    return v ? Number(v) : 0
  }
  const cur = memEmail.get(emailKey)
  const now = Date.now()
  if (!cur || cur.resetAt <= now) return 0
  return cur.count
}
