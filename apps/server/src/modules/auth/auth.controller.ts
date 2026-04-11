import type { FastifyReply, FastifyRequest } from 'fastify'
import {
  REFRESH_COOKIE,
  REFRESH_TTL_MS,
  loginBodySchema,
  registerBodySchema,
  verifyEmailBodySchema,
} from './auth.model.js'
import type { AuthService } from './auth.service.js'

function badInput(reply: FastifyReply) {
  return reply.status(400).send({ success: false, error: 'Invalid input', code: 'VALIDATION' })
}

function setRefreshCookie(reply: FastifyReply, env: { NODE_ENV?: string }, raw: string) {
  const secure = env.NODE_ENV === 'production'
  const sameSite = secure ? ('strict' as const) : ('lax' as const)
  reply.setCookie(REFRESH_COOKIE, raw, {
    httpOnly: true,
    secure,
    sameSite,
    path: '/',
    maxAge: Math.floor(REFRESH_TTL_MS / 1000),
  })
}

export function createAuthController(service: AuthService) {
  return {
    async register(request: FastifyRequest, reply: FastifyReply) {
      const parsed = registerBodySchema.safeParse(request.body)
      if (!parsed.success) return badInput(reply)
      const out = await service.register(parsed.data, {
        ip: request.ip,
        onSuspiciousBurst: (n) => {
          request.log.warn({ ip: request.ip, n }, 'suspicious_registration_burst')
        },
        onVerificationTokenLogged: (userId, raw) => {
          request.log.info(
            { requestId: request.requestId, userId },
            `email_verification_token=${raw}`,
          )
        },
      })
      if (out.kind === 'honeypot') {
        return reply.send({
          success: true,
          data: { accessToken: out.accessToken, user: out.user },
        })
      }
      if (out.kind === 'conflict') {
        return reply
          .status(409)
          .send({ success: false, error: 'Email already registered', code: 'CONFLICT' })
      }
      setRefreshCookie(reply, request.server.deps.env, out.refreshRaw)
      return reply.status(201).send({
        success: true,
        data: { accessToken: out.accessToken, user: out.user },
      })
    },

    async login(request: FastifyRequest, reply: FastifyReply) {
      const parsed = loginBodySchema.safeParse(request.body)
      if (!parsed.success) return badInput(reply)
      const out = await service.login(parsed.data, request.ip)
      if (out.kind === 'auth_failed') {
        return reply.status(401).send({ success: false, error: out.message, code: 'AUTH' })
      }
      if (out.kind === 'suspended') {
        return reply.status(403).send({
          success: false,
          error: 'Your account has been suspended. Contact support at support@dripnsole.ph',
          code: 'ACCOUNT_SUSPENDED',
        })
      }
      setRefreshCookie(reply, request.server.deps.env, out.refreshRaw)
      return reply.send({
        success: true,
        data: { accessToken: out.accessToken, user: out.user },
      })
    },

    async refresh(request: FastifyRequest, reply: FastifyReply) {
      const raw = request.cookies[REFRESH_COOKIE]
      const out = await service.refresh(raw)
      if (out.kind === 'unauthorized') {
        return reply.status(401).send({ success: false, error: 'Unauthorized', code: 'AUTH' })
      }
      if (out.kind === 'reuse_detected') {
        reply.clearCookie(REFRESH_COOKIE, { path: '/' })
        return reply.status(401).send({ success: false, error: 'Unauthorized', code: 'AUTH' })
      }
      setRefreshCookie(reply, request.server.deps.env, out.refreshRaw)
      return reply.send({ success: true, data: { accessToken: out.accessToken } })
    },

    async logout(request: FastifyRequest, reply: FastifyReply) {
      const raw = request.cookies[REFRESH_COOKIE]
      await service.logout(request.accessJti, raw)
      reply.clearCookie(REFRESH_COOKIE, { path: '/' })
      return reply.send({ success: true, data: { ok: true } })
    },

    async verifyEmail(request: FastifyRequest, reply: FastifyReply) {
      const parsed = verifyEmailBodySchema.safeParse(request.body)
      if (!parsed.success) return badInput(reply)
      const out = await service.verifyEmail(parsed.data)
      if (out.kind === 'invalid') {
        return reply
          .status(400)
          .send({ success: false, error: 'Invalid or expired token', code: 'VALIDATION' })
      }
      return reply.send({ success: true, data: { ok: true } })
    },

    async me(request: FastifyRequest, reply: FastifyReply) {
      const uid = request.userId
      if (!uid) {
        return reply.status(401).send({ success: false, error: 'Unauthorized', code: 'AUTH' })
      }
      const out = await service.me(uid)
      if (out.kind === 'unauthorized') {
        return reply.status(401).send({ success: false, error: 'Unauthorized', code: 'AUTH' })
      }
      return reply.send({ success: true, data: out.data })
    },
  }
}
