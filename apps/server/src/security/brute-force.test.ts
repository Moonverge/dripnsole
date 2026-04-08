import Redis from 'ioredis-mock'
import { randomUUID } from 'node:crypto'
import { describe, expect, it, beforeEach, vi } from 'vitest'
import {
  clearFailedLogin,
  emailKeyForBrute,
  getEmailFailureCount,
  isEmailLocked,
  isIpBlocked,
  recordFailedLogin,
} from './brute-force.js'
import type { RedisClient } from '../redis/client.js'

describe('brute-force', () => {
  let redis: RedisClient

  beforeEach(() => {
    redis = new Redis() as unknown as RedisClient
  })

  it('recordFailedLogin — five failures on email sets lock for sixth check', async () => {
    const email = emailKeyForBrute('A@B.COM')
    for (let i = 0; i < 5; i += 1) {
      await recordFailedLogin(redis, '1.2.3.4', email)
    }
    const sec = await isEmailLocked(redis, email)
    expect(sec).toBeGreaterThan(0)
  })

  it('recordFailedLogin — IP failures are tracked separately from email lock', async () => {
    const email = emailKeyForBrute('x@y.z')
    for (let i = 0; i < 5; i += 1) {
      await recordFailedLogin(redis, '9.9.9.9', email)
    }
    expect(await isEmailLocked(redis, email)).toBeGreaterThan(0)
    const otherEmail = emailKeyForBrute('other@y.z')
    for (let i = 0; i < 4; i += 1) {
      await recordFailedLogin(redis, '9.9.9.9', otherEmail)
    }
    expect(await getEmailFailureCount(redis, otherEmail)).toBe(4)
  })

  it('clearFailedLogin — resets email failure counter', async () => {
    const email = emailKeyForBrute('u@v.w')
    await recordFailedLogin(redis, '1.1.1.1', email)
    await recordFailedLogin(redis, '1.1.1.1', email)
    await clearFailedLogin(redis, '1.1.1.1', email)
    expect(await getEmailFailureCount(redis, email)).toBe(0)
  })

  it('recordFailedLogin — returns retry window seconds when locked', async () => {
    const email = emailKeyForBrute('lock@t.z')
    for (let i = 0; i < 5; i += 1) {
      const r = await recordFailedLogin(redis, '5.5.5.5', email)
      if (i === 4) {
        expect(r.emailLockedSec).toBeGreaterThan(0)
        expect(r.failuresForEmail).toBe(5)
      }
    }
  })

  it('recordFailedLogin — twenty IP failures block IP', async () => {
    const ip = `20.${randomUUID().slice(0, 8)}.1.1`
    for (let i = 0; i < 20; i += 1) {
      await recordFailedLogin(redis, ip, emailKeyForBrute(`u${i}@ip.block`))
    }
    expect(await isIpBlocked(redis, ip)).toBeGreaterThan(0)
  })

  it('getEmailFailureCount — redis returns parsed count', async () => {
    const email = emailKeyForBrute(`count@${randomUUID()}.t`)
    await recordFailedLogin(redis, '1.1.1.1', email)
    expect(await getEmailFailureCount(redis, email)).toBeGreaterThanOrEqual(1)
  })
})

describe('brute-force without redis', () => {
  it('recordFailedLogin — locks email after five failures in memory', async () => {
    const ip = `mem.${randomUUID().slice(0, 8)}.0.1`
    const email = emailKeyForBrute(`mem@${randomUUID()}.t`)
    for (let i = 0; i < 5; i += 1) {
      await recordFailedLogin(null, ip, email)
    }
    expect(await isEmailLocked(null, email)).toBeGreaterThan(0)
  })

  it('recordFailedLogin — blocks IP after twenty failures in memory', async () => {
    const ip = `mem.${randomUUID().slice(0, 8)}.0.2`
    for (let i = 0; i < 20; i += 1) {
      await recordFailedLogin(null, ip, emailKeyForBrute(`m${i}@${randomUUID()}.t`))
    }
    expect(await isIpBlocked(null, ip)).toBeGreaterThan(0)
  })

  it('clearFailedLogin — clears memory counters', async () => {
    const ip = `mem.${randomUUID().slice(0, 8)}.0.3`
    const email = emailKeyForBrute(`clr@${randomUUID()}.t`)
    await recordFailedLogin(null, ip, email)
    await clearFailedLogin(null, ip, email)
    expect(await getEmailFailureCount(null, email)).toBe(0)
  })

  it('isEmailLocked — memory lock clears after TTL window', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2020-01-01T00:00:00Z'))
    const ip = `mem.${randomUUID().slice(0, 8)}.0.4`
    const email = emailKeyForBrute(`exp@${randomUUID()}.t`)
    for (let i = 0; i < 5; i += 1) {
      await recordFailedLogin(null, ip, email)
    }
    expect(await isEmailLocked(null, email)).toBeGreaterThan(0)
    vi.setSystemTime(new Date('2020-01-01T00:16:00Z'))
    expect(await isEmailLocked(null, email)).toBe(0)
    vi.useRealTimers()
  })

  it('isIpBlocked — memory block clears after TTL window', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2021-06-01T12:00:00Z'))
    const ip = `mem.${randomUUID().slice(0, 8)}.0.5`
    for (let i = 0; i < 20; i += 1) {
      await recordFailedLogin(null, ip, emailKeyForBrute(`b${i}@${randomUUID()}.t`))
    }
    expect(await isIpBlocked(null, ip)).toBeGreaterThan(0)
    vi.setSystemTime(new Date('2021-06-01T13:01:00Z'))
    expect(await isIpBlocked(null, ip)).toBe(0)
    vi.useRealTimers()
  })

  it('getEmailFailureCount — memory returns 0 after rolling window', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2022-03-01T00:00:00Z'))
    const ip = `mem.${randomUUID().slice(0, 8)}.0.6`
    const email = emailKeyForBrute(`roll@${randomUUID()}.t`)
    await recordFailedLogin(null, ip, email)
    expect(await getEmailFailureCount(null, email)).toBe(1)
    vi.setSystemTime(new Date('2022-03-01T00:16:00Z'))
    expect(await getEmailFailureCount(null, email)).toBe(0)
    vi.useRealTimers()
  })
})
