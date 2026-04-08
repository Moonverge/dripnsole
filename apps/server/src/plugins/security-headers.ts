import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import helmet from '@fastify/helmet'
import type { ServerEnv } from '@dripnsole/config'

export function securityHeadersPlugin(env: ServerEnv): FastifyPluginAsync {
  const plugin: FastifyPluginAsync = async (fastify) => {
    const cdnHost = env.CDN_DOMAIN ?? (env.CDN_BASE_URL ? new URL(env.CDN_BASE_URL).hostname : null)
    const imgSrc = ["'self'", 'data:', 'blob:', ...(cdnHost ? [`https://${cdnHost}`] : [])]

    await fastify.register(helmet, {
      global: true,
      contentSecurityPolicy: {
        useDefaults: false,
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc,
          connectSrc: ["'self'", 'https://graph.facebook.com', 'https://api.instagram.com'],
          frameAncestors: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: { policy: 'same-origin' },
      crossOriginResourcePolicy: { policy: 'same-site' },
      xPoweredBy: false,
      hsts:
        env.NODE_ENV === 'production'
          ? { maxAge: 31536000, includeSubDomains: true, preload: true }
          : false,
      frameguard: { action: 'deny' },
      noSniff: true,
      xssFilter: false,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      permittedCrossDomainPolicies: false,
    })

    fastify.addHook('onSend', async (_req, reply) => {
      reply.removeHeader('Server')
      reply.header('X-XSS-Protection', '0')
      reply.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()')
    })
  }

  return fp(plugin, { name: 'security-headers', encapsulate: false })
}
