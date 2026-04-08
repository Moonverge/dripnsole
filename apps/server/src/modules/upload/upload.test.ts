import FormData from 'form-data'
import { describe, expect, it, beforeEach, vi } from 'vitest'
import {
  integrationContext,
  resetDatabase,
  protectedHeaders,
} from '../../../tests/helpers/integration-context.js'
import { loginVerifiedSeller } from '../../../tests/helpers/session.js'
import { fakeTextAsJpegBuffer, pngBytesAsJpegClaim } from '../../../tests/helpers/magic-bytes.js'
import { tinyJpeg, tinyPng, tinyWebp } from '../../../tests/helpers/image-fixtures.js'
import { createUploadService } from './upload.service.js'
import type { UploadRepository } from './upload.repository.js'

vi.mock('@aws-sdk/client-s3', () => {
  class S3Client {
    send = vi.fn().mockResolvedValue({})
  }
  class PutObjectCommand {
    constructor(_input: unknown) {}
  }
  return { S3Client, PutObjectCommand }
})

describe('upload module', () => {
  beforeEach(resetDatabase)

  it('POST /api/upload/ — jpeg returns 200 with cdn urls', async () => {
    const { app } = await integrationContext()
    const db = app.deps.db
    const { token } = await loginVerifiedSeller(app, db)
    const buf = await tinyJpeg()
    const form = new FormData()
    form.append('file', buf, { filename: 'a.jpg', contentType: 'image/jpeg' })
    const res = await app.inject({
      method: 'POST',
      url: '/api/upload/',
      headers: { ...form.getHeaders(), ...protectedHeaders(token) },
      payload: form,
    })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body) as { data: { photos: { url: string }[] } }
    expect(body.data.photos[0]?.url.includes('cdn.example.com')).toBe(true)
    expect(body.data.photos[0]?.url.includes('r2.example.com')).toBe(false)
  })

  it('POST /api/upload/ — png returns 200', async () => {
    const { app } = await integrationContext()
    const db = app.deps.db
    const { token } = await loginVerifiedSeller(app, db)
    const buf = await tinyPng()
    const form = new FormData()
    form.append('file', buf, { filename: 'a.png', contentType: 'image/png' })
    const res = await app.inject({
      method: 'POST',
      url: '/api/upload/',
      headers: { ...form.getHeaders(), ...protectedHeaders(token) },
      payload: form,
    })
    expect(res.statusCode).toBe(200)
  })

  it('POST /api/upload/ — webp returns 200', async () => {
    const { app } = await integrationContext()
    const db = app.deps.db
    const { token } = await loginVerifiedSeller(app, db)
    const buf = await tinyWebp()
    const form = new FormData()
    form.append('file', buf, { filename: 'a.webp', contentType: 'image/webp' })
    const res = await app.inject({
      method: 'POST',
      url: '/api/upload/',
      headers: { ...form.getHeaders(), ...protectedHeaders(token) },
      payload: form,
    })
    expect(res.statusCode).toBe(200)
  })

  it('POST /api/upload/ — jpg claim with png bytes returns 400', async () => {
    const { app } = await integrationContext()
    const db = app.deps.db
    const { token } = await loginVerifiedSeller(app, db)
    const form = new FormData()
    form.append('file', pngBytesAsJpegClaim(), { filename: 'x.jpg', contentType: 'image/jpeg' })
    const res = await app.inject({
      method: 'POST',
      url: '/api/upload/',
      headers: { ...form.getHeaders(), ...protectedHeaders(token) },
      payload: form,
    })
    expect(res.statusCode).toBe(400)
  })

  it('POST /api/upload/ — fake jpeg returns 400', async () => {
    const { app } = await integrationContext()
    const db = app.deps.db
    const { token } = await loginVerifiedSeller(app, db)
    const form = new FormData()
    form.append('file', fakeTextAsJpegBuffer(), { filename: 'x.jpg', contentType: 'image/jpeg' })
    const res = await app.inject({
      method: 'POST',
      url: '/api/upload/',
      headers: { ...form.getHeaders(), ...protectedHeaders(token) },
      payload: form,
    })
    expect(res.statusCode).toBe(400)
  })

  it('POST /api/upload/ — more than eight files returns 400', async () => {
    const { app } = await integrationContext()
    const db = app.deps.db
    const { token } = await loginVerifiedSeller(app, db)
    const buf = await tinyJpeg()
    const form = new FormData()
    for (let i = 0; i < 9; i += 1) {
      form.append('file', buf, { filename: `a${i}.jpg`, contentType: 'image/jpeg' })
    }
    const res = await app.inject({
      method: 'POST',
      url: '/api/upload/',
      headers: { ...form.getHeaders(), ...protectedHeaders(token) },
      payload: form,
    })
    expect(res.statusCode).toBe(400)
  })

  it('POST /api/upload/ — unauthenticated returns 401', async () => {
    const { app } = await integrationContext()
    const buf = await tinyJpeg()
    const form = new FormData()
    form.append('file', buf, { filename: 'a.jpg', contentType: 'image/jpeg' })
    const res = await app.inject({
      method: 'POST',
      url: '/api/upload/',
      headers: form.getHeaders(),
      payload: form,
    })
    expect(res.statusCode).toBe(401)
  })
})

describe('upload validateBuffers', () => {
  it('rejects total payload over 25mb', async () => {
    const repo = { insertPendingPhoto: vi.fn() } as unknown as UploadRepository
    const svc = createUploadService(repo)
    const one = Buffer.alloc(13 * 1024 * 1024, 0)
    one[0] = 0xff
    one[1] = 0xd8
    one[2] = 0xff
    const two = Buffer.alloc(13 * 1024 * 1024, 0)
    two[0] = 0xff
    two[1] = 0xd8
    two[2] = 0xff
    const out = await svc.validateBuffers([
      { mime: 'image/jpeg', buf: one },
      { mime: 'image/jpeg', buf: two },
    ])
    expect(out.ok).toBe(false)
    if (!out.ok) expect(out.code).toBe('too_large')
  })
})
