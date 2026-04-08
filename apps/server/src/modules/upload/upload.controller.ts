import type { FastifyReply, FastifyRequest } from 'fastify'
import { UPLOAD_ALLOWED_MIMES, UPLOAD_MAX_FILES } from './upload.model.js'
import type { UploadBuffer, UploadService } from './upload.service.js'

function validationError(reply: FastifyReply, error: string, code: string) {
  return reply.status(400).send({ success: false, error, code })
}

export function createUploadController(service: UploadService) {
  return {
    async upload(request: FastifyRequest, reply: FastifyReply) {
      const env = request.server.deps.env
      const envCheck = service.checkEnv(env)
      if (!envCheck.ok && envCheck.unavailable) {
        return reply
          .status(503)
          .send({ success: false, error: 'Uploads unavailable', code: 'UNAVAILABLE' })
      }

      const buffers: UploadBuffer[] = []
      let fileCount = 0
      for await (const part of request.parts()) {
        if (part.type !== 'file') continue
        fileCount += 1
        if (fileCount > UPLOAD_MAX_FILES) {
          return validationError(reply, 'Too many files', 'VALIDATION')
        }
        const mime = part.mimetype
        if (!UPLOAD_ALLOWED_MIMES.includes(mime as UploadBuffer['mime'])) {
          return validationError(reply, 'Invalid file type', 'VALIDATION')
        }
        const buf = await part.toBuffer()
        buffers.push({ mime: mime as UploadBuffer['mime'], buf })
      }

      const validated = await service.validateBuffers(buffers)
      if (!validated.ok) {
        if (validated.code === 'too_many') {
          return validationError(reply, 'Too many files', 'VALIDATION')
        }
        if (validated.code === 'no_files') {
          return validationError(reply, 'No files', 'VALIDATION')
        }
        if (validated.code === 'bad_type') {
          return validationError(reply, 'Invalid file type', 'VALIDATION')
        }
        if (validated.code === 'bad_magic') {
          return validationError(reply, 'Invalid image data', 'VALIDATION')
        }
        if (validated.code === 'too_large') {
          return validationError(reply, 'Upload too large', 'VALIDATION')
        }
        return validationError(reply, 'Invalid image', 'VALIDATION')
      }

      const data = await service.persistImages(request.userId!, buffers, env)
      return reply.send({ success: true, data })
    },
  }
}
