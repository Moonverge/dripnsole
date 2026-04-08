import { config } from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseServerEnv } from '@dripnsole/config'
import { Server } from 'socket.io'
import { buildApp } from './build-app.js'
import { getJwtKeys } from './lib/jwt-keys.js'
import { verifyAccessToken } from './lib/access-jwt.js'
import { createRedis } from './redis/client.js'
import { startBackgroundJobs } from './jobs/background.js'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
config({ path: path.join(repoRoot, '.env') })

let env: ReturnType<typeof parseServerEnv>
try {
  env = parseServerEnv()
} catch (err) {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
}

const redis = createRedis(env)
if (redis) {
  await redis.connect().catch(() => {})
}

const keys = await getJwtKeys(env)
const { fastify, pool } = await buildApp({
  env,
  jwtPrivate: keys.privateKey,
  jwtPublic: keys.publicKey,
  redis,
})

await fastify.ready()

const io = new Server(fastify.server, {
  cors: { origin: env.ALLOWED_ORIGINS, credentials: true },
})

io.use(async (socket, next) => {
  try {
    const token = String((socket.handshake.auth as { token?: string }).token ?? '')
    if (!token) {
      next(new Error('Unauthorized'))
      return
    }
    await verifyAccessToken(keys.publicKey, token, redis)
    next()
  } catch {
    next(new Error('Unauthorized'))
  }
})

io.on('connection', (socket) => {
  socket.on('join:conversation', (conversationId: string) => {
    socket.join(`conversation:${conversationId}`)
  })
})

const stopJobs = startBackgroundJobs({ pool, redis })

await fastify.listen({ port: env.PORT, host: '0.0.0.0' })
fastify.log.info(`Server running at http://localhost:${env.PORT}`)

function shutdown() {
  stopJobs()
  io.close()
  void fastify.close()
  void pool.end()
  void redis?.quit()
}

process.on('SIGINT', () => {
  shutdown()
  process.exit(0)
})
