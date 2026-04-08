import type { FastifyInstance } from 'fastify'
import type { Db } from '../../src/db/client.js'
import { createPendingPhoto, createStore, createVerifiedUser, markUserSeller } from './seed.js'
import { ORIGIN_ALLOWED } from './integration-context.js'

export async function loginAs(
  app: FastifyInstance,
  email: string,
  plainPassword: string,
): Promise<{ accessToken: string; rawSetCookie: string | undefined }> {
  const res = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    headers: { origin: ORIGIN_ALLOWED },
    payload: { email, password: plainPassword },
  })
  if (res.statusCode !== 200) {
    throw new Error(`login failed: ${res.statusCode} ${res.body}`)
  }
  const accessToken = (JSON.parse(res.body) as { data: { accessToken: string } }).data.accessToken
  const c = res.headers['set-cookie']
  const rawSetCookie = Array.isArray(c) ? c[0] : c
  return { accessToken, rawSetCookie }
}

export async function loginVerifiedSeller(
  app: FastifyInstance,
  db: Db,
): Promise<{ token: string; userId: string; storeId: string; photoId: string }> {
  const { user, plainPassword } = await createVerifiedUser(db)
  await markUserSeller(db, user.id)
  const store = await createStore(db, user.id)
  const photo = await createPendingPhoto(db, user.id)
  const res = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    headers: { origin: ORIGIN_ALLOWED },
    payload: { email: user.email, password: plainPassword },
  })
  if (res.statusCode !== 200) {
    throw new Error(`login failed: ${res.body}`)
  }
  const token = (JSON.parse(res.body) as { data: { accessToken: string } }).data.accessToken
  return { token, userId: user.id, storeId: store.id, photoId: photo.id }
}
