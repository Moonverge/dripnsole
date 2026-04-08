import { randomUUID } from 'node:crypto'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import sharp from 'sharp'
import type { ServerEnv } from '@dripnsole/config'
import type { UploadRepository } from './upload.repository.js'
import { UPLOAD_ALLOWED_MIMES, UPLOAD_MAX_FILES, type UploadMime } from './upload.model.js'

function magicMatches(buf: Buffer, mime: string): boolean {
  if (buf.length < 12) return false
  if (mime === 'image/jpeg') return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff
  if (mime === 'image/png') {
    const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    return buf.subarray(0, 8).equals(sig)
  }
  if (mime === 'image/webp') {
    return buf.subarray(0, 4).toString() === 'RIFF' && buf.subarray(8, 12).toString() === 'WEBP'
  }
  return false
}

export type UploadBuffer = { mime: UploadMime; buf: Buffer }

export function createUploadService(repo: UploadRepository) {
  return {
    checkEnv(env: ServerEnv): { ok: true } | { ok: false; unavailable: boolean } {
      if (
        !env.CLOUDFLARE_R2_BUCKET ||
        !env.CLOUDFLARE_R2_ENDPOINT ||
        !env.CLOUDFLARE_R2_ACCESS_KEY ||
        !env.CLOUDFLARE_R2_SECRET_KEY ||
        !env.CDN_BASE_URL
      ) {
        if (env.NODE_ENV === 'production') {
          return { ok: false, unavailable: true }
        }
      }
      return { ok: true }
    },

    async validateBuffers(buffers: UploadBuffer[]): Promise<
      | { ok: true }
      | {
          ok: false
          code: 'too_many' | 'no_files' | 'bad_type' | 'bad_magic' | 'bad_image' | 'too_large'
        }
    > {
      if (buffers.length > UPLOAD_MAX_FILES) return { ok: false, code: 'too_many' }
      if (buffers.length === 0) return { ok: false, code: 'no_files' }
      const maxTotal = 25 * 1024 * 1024
      let total = 0
      for (const { buf } of buffers) {
        total += buf.length
      }
      if (total > maxTotal) return { ok: false, code: 'too_large' }
      for (const { mime, buf } of buffers) {
        if (!UPLOAD_ALLOWED_MIMES.includes(mime)) return { ok: false, code: 'bad_type' }
        const head = buf.subarray(0, 12)
        if (!magicMatches(head, mime)) return { ok: false, code: 'bad_magic' }
        try {
          await sharp(buf).metadata()
        } catch {
          return { ok: false, code: 'bad_image' }
        }
      }
      return { ok: true }
    },

    async persistImages(userId: string, buffers: UploadBuffer[], env: ServerEnv) {
      const client =
        env.CLOUDFLARE_R2_ENDPOINT && env.CLOUDFLARE_R2_ACCESS_KEY && env.CLOUDFLARE_R2_SECRET_KEY
          ? new S3Client({
              region: 'auto',
              endpoint: env.CLOUDFLARE_R2_ENDPOINT,
              credentials: {
                accessKeyId: env.CLOUDFLARE_R2_ACCESS_KEY,
                secretAccessKey: env.CLOUDFLARE_R2_SECRET_KEY,
              },
            })
          : null

      const urls: { id: string; url: string }[] = []
      let order = 0
      for (const { buf } of buffers) {
        const webp = await sharp(buf)
          .rotate()
          .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 82 })
          .toBuffer()
        const key = `${randomUUID()}.webp`
        const cdnBase = env.CDN_BASE_URL?.replace(/\/$/, '') ?? ''
        const url = cdnBase ? `${cdnBase}/${key}` : `http://localhost:4000/dev-upload/${key}`

        if (client && env.CLOUDFLARE_R2_BUCKET) {
          await client.send(
            new PutObjectCommand({
              Bucket: env.CLOUDFLARE_R2_BUCKET,
              Key: key,
              Body: webp,
              ContentType: 'image/webp',
              ContentDisposition: 'attachment',
            }),
          )
        }

        const inserted = await repo.insertPendingPhoto({
          uploadedBy: userId,
          url,
          order,
        })
        const row = inserted[0]
        if (row) urls.push({ id: row.id, url })
        order += 1
      }
      return { photos: urls }
    },
  }
}

export type UploadService = ReturnType<typeof createUploadService>
