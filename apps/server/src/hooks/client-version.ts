import type { preHandlerHookHandler } from 'fastify'

export const requireClientVersion: preHandlerHookHandler = async (request, reply) => {
  if (request.routeOptions.config?.public) return
  const v = request.headers['x-client-version']
  if (!v || String(v).trim() === '') {
    return reply
      .status(400)
      .send({ success: false, error: 'Missing X-Client-Version', code: 'CLIENT_VERSION' })
  }
}
