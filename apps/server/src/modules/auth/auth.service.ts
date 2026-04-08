import { randomBytes, randomUUID } from 'node:crypto'
import bcrypt from 'bcrypt'
import type { KeyLike } from 'jose'
import type { Db } from '../../db/client.js'
import type { RedisClient } from '../../redis/client.js'
import { signAccessToken, denyAccessJti } from '../../lib/access-jwt.js'
import { HttpError } from '../../lib/http-error.js'
import { sanitizePlainText } from '../../lib/sanitize-text.js'
import { hashRefreshToken, newRefreshTokenRaw } from '../../lib/refresh-token.js'
import {
  clearFailedLogin,
  emailKeyForBrute,
  getEmailFailureCount,
  isEmailLocked,
  isIpBlocked,
  recordFailedLogin,
} from '../../security/brute-force.js'
import type { AuthRepository } from './auth.repository.js'
import {
  ACCESS_TTL_SEC,
  REFRESH_TTL_MS,
  hashVerifyToken,
  type LoginBody,
  type RegisterBody,
  type VerifyEmailBody,
} from './auth.model.js'

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

export function createAuthService(input: {
  db: Db
  redis: RedisClient | null
  jwtPrivate: KeyLike
  repo: AuthRepository
}) {
  const { db, redis, jwtPrivate, repo } = input

  async function issueSession(userId: string) {
    const { token: accessToken } = await signAccessToken(jwtPrivate, userId)
    const raw = newRefreshTokenRaw()
    const tokenHash = hashRefreshToken(raw)
    const familyId = repo.newFamilyId()
    const expiresAt = new Date(Date.now() + REFRESH_TTL_MS)
    await repo.insertRefreshToken({ userId, tokenHash, familyId, expiresAt })
    return { accessToken, refreshRaw: raw }
  }

  return {
    async register(
      body: RegisterBody,
      ctx: {
        ip: string
        onSuspiciousBurst?: (count: number) => void
        onVerificationTokenLogged: (userId: string, raw: string) => void
      },
    ) {
      if (body.website?.trim()) {
        const fakeUserId = randomUUID()
        const { token: accessToken } = await signAccessToken(jwtPrivate, fakeUserId)
        return {
          kind: 'honeypot' as const,
          accessToken,
          user: {
            id: fakeUserId,
            email: body.email,
            name: sanitizePlainText(body.name),
            isSeller: false,
            emailVerified: false,
            createdAt: new Date().toISOString(),
          },
        }
      }

      if (redis) {
        const k = `reg:ip:${ctx.ip}`
        const n = await redis.incr(k)
        if (n === 1) await redis.expire(k, 3600)
        if (n >= 3) {
          ctx.onSuspiciousBurst?.(n)
        }
      }

      const email = body.email.trim().toLowerCase()
      const name = sanitizePlainText(body.name)
      const passwordHash = await bcrypt.hash(body.password, 12)
      const rawVerify = randomBytes(32).toString('hex')
      const verifyHash = hashVerifyToken(rawVerify)
      const verifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000)

      try {
        const inserted = await repo.insertUserReturning({
          email,
          passwordHash,
          name,
          emailVerificationTokenHash: verifyHash,
          emailVerificationExpiresAt: verifyExpires,
        })
        const row = inserted[0]
        if (!row) throw new Error('insert_failed')

        ctx.onVerificationTokenLogged(row.id, rawVerify)

        const { accessToken, refreshRaw } = await issueSession(row.id)
        return {
          kind: 'ok' as const,
          accessToken,
          refreshRaw,
          user: {
            id: row.id,
            email: row.email,
            name: row.name,
            isSeller: row.isSeller,
            emailVerified: row.emailVerified,
            createdAt: row.createdAt.toISOString(),
          },
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        if (msg.includes('unique') || msg.includes('duplicate')) {
          return { kind: 'conflict' as const }
        }
        throw e
      }
    },

    async login(body: LoginBody, ip: string) {
      const email = body.email.trim().toLowerCase()
      const emailKey = emailKeyForBrute(email)

      const ipBlock = await isIpBlocked(redis, ip)
      if (ipBlock > 0) {
        throw new HttpError(423, 'Too many failed attempts', 'LOCKED', {
          'retry-after': String(ipBlock),
        })
      }
      const emailLock = await isEmailLocked(redis, emailKey)
      if (emailLock > 0) {
        throw new HttpError(423, 'Too many failed attempts', 'LOCKED', {
          'retry-after': String(emailLock),
        })
      }

      const prevFails = await getEmailFailureCount(redis, emailKey)
      await sleep(Math.min(2000, 100 * 2 ** Math.min(prevFails, 4)))

      const rows = await repo.findUserByEmail(email)
      const user = rows[0]
      const invalidMsg = 'Invalid email or password'

      if (!user) {
        await recordFailedLogin(redis, ip, emailKey)
        return { kind: 'auth_failed' as const, message: invalidMsg }
      }

      const ok = await bcrypt.compare(body.password, user.passwordHash)
      if (!ok) {
        await recordFailedLogin(redis, ip, emailKey)
        return { kind: 'auth_failed' as const, message: invalidMsg }
      }

      await clearFailedLogin(redis, ip, emailKey)

      const { accessToken, refreshRaw } = await issueSession(user.id)
      return {
        kind: 'ok' as const,
        accessToken,
        refreshRaw,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          isSeller: user.isSeller,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt.toISOString(),
        },
      }
    },

    async refresh(rawCookie: string | undefined) {
      if (!rawCookie) {
        return { kind: 'unauthorized' as const }
      }
      const tokenHash = hashRefreshToken(rawCookie)
      const rows = await repo.findRefreshByHash(tokenHash)
      const row = rows[0]
      if (!row || row.invalidatedAt || row.expiresAt.getTime() < Date.now()) {
        return { kind: 'unauthorized' as const }
      }
      if (row.replacedAt) {
        await repo.invalidateRefreshFamily(row.familyId)
        return { kind: 'reuse_detected' as const }
      }

      const newRaw = newRefreshTokenRaw()
      const newHash = hashRefreshToken(newRaw)
      const expiresAt = new Date(Date.now() + REFRESH_TTL_MS)

      await db.transaction(async (tx) => {
        await repo.markRefreshReplaced(tx, row.id)
        await repo.insertRefreshInTx(tx, {
          userId: row.userId,
          tokenHash: newHash,
          familyId: row.familyId,
          expiresAt,
        })
      })

      const { token: accessToken } = await signAccessToken(jwtPrivate, row.userId)
      return { kind: 'ok' as const, accessToken, refreshRaw: newRaw }
    },

    async logout(jti: string | undefined, refreshCookie: string | undefined) {
      if (jti) {
        await denyAccessJti(redis, jti, ACCESS_TTL_SEC)
      }
      if (refreshCookie) {
        const tokenHash = hashRefreshToken(refreshCookie)
        await repo.invalidateRefreshByHash(tokenHash)
      }
      return { ok: true as const }
    },

    async verifyEmail(body: VerifyEmailBody) {
      const h = hashVerifyToken(body.token)
      const found = await repo.findUserByVerificationHash(h)
      const user = found[0]
      if (
        !user ||
        !user.emailVerificationExpiresAt ||
        user.emailVerificationExpiresAt.getTime() < Date.now()
      ) {
        return { kind: 'invalid' as const }
      }
      await repo.markEmailVerified(user.id)
      return { kind: 'ok' as const }
    },

    async me(userId: string) {
      const urows = await repo.findUserById(userId)
      const user = urows[0]
      if (!user) {
        return { kind: 'unauthorized' as const }
      }
      const srows = await repo.findStoreByUserId(userId)
      const store = srows[0]
      const cats = store ? await repo.listStoreCategories(store.id) : []
      return {
        kind: 'ok' as const,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            profilePic: user.profilePic,
            isSeller: user.isSeller,
            emailVerified: user.emailVerified,
            createdAt: user.createdAt.toISOString(),
          },
          hasStore: Boolean(store),
          store: store
            ? {
                id: store.id,
                userId: store.userId,
                handle: store.handle,
                name: store.name,
                bio: store.bio,
                bannerUrl: store.bannerUrl,
                pickupInfo: store.pickupInfo ?? '',
                shippingInfo: store.shippingInfo ?? '',
                badge: store.badge,
                rating: Number(store.rating),
                reviewCount: store.reviewCount,
                completedTransactions: store.completedTransactions,
                followerCount: store.followerCount,
                fbConnected: store.fbConnected,
                igConnected: store.igConnected,
                categories: cats.map((c) => c.category),
                createdAt: store.createdAt.toISOString(),
              }
            : null,
        },
      }
    },
  }
}

export type AuthService = ReturnType<typeof createAuthService>
