import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import { randomUUID } from 'node:crypto'

const plugin: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('onRequest', async (request, reply) => {
    const id = randomUUID()
    request.requestId = id
    reply.header('X-Request-ID', id)
  })
}

export const requestContextPlugin = fp(plugin, {
  name: 'request-context',
  encapsulate: false,
})
