import type { preHandlerHookHandler } from 'fastify'
import { eq } from 'drizzle-orm'
import { verifyAccessToken } from '../lib/access-jwt.js'
import { users } from '../db/schema.js'

export const requireAuth: preHandlerHookHandler = async (request, reply) => {
  const auth = request.headers.authorization
  if (!auth?.startsWith('Bearer ')) {
    return reply.status(401).send({ success: false, error: 'Unauthorized', code: 'AUTH' })
  }
  const token = auth.slice(7)
  try {
    const payload = await verifyAccessToken(
      request.server.deps.jwtPublic,
      token,
      request.server.deps.redis,
    )
    request.userId = payload.sub
    request.userRole = payload.role
    request.accessJti = payload.jti
  } catch {
    request.log.warn({ requestId: request.requestId }, 'invalid_access_token')
    return reply.status(401).send({ success: false, error: 'Unauthorized', code: 'AUTH' })
  }

  const db = request.server.deps.db
  const row = await db
    .select({ suspendedAt: users.suspendedAt })
    .from(users)
    .where(eq(users.id, request.userId))
    .limit(1)
  if (row[0]?.suspendedAt) {
    return reply.status(403).send({
      success: false,
      error: 'Your account has been suspended. Contact support at support@dripnsole.ph',
      code: 'ACCOUNT_SUSPENDED',
    })
  }
}

export const requireSeller: preHandlerHookHandler = async (request, reply) => {
  if (request.userRole !== 'seller' && request.userRole !== 'admin') {
    return reply
      .status(403)
      .send({ success: false, error: 'Seller access required', code: 'FORBIDDEN' })
  }
}

export const requireAdmin: preHandlerHookHandler = async (request, reply) => {
  if (request.userRole !== 'admin') {
    return reply
      .status(403)
      .send({ success: false, error: 'Admin access required', code: 'FORBIDDEN' })
  }
}

export const requireEmailVerified: preHandlerHookHandler = async (request, reply) => {
  const uid = request.userId
  if (!uid) {
    return reply.status(401).send({ success: false, error: 'Unauthorized', code: 'AUTH' })
  }
  const db = request.server.deps.db
  const row = await db
    .select({ emailVerified: users.emailVerified })
    .from(users)
    .where(eq(users.id, uid))
    .limit(1)
  if (!row[0]?.emailVerified) {
    return reply
      .status(403)
      .send({ success: false, error: 'Email not verified', code: 'EMAIL_NOT_VERIFIED' })
  }
}
