import { listingPhotos } from '../../db/schema.js'
import type { Db } from '../../db/client.js'

export function createUploadRepository(db: Db) {
  return {
    insertPendingPhoto(input: { uploadedBy: string; url: string; order: number }) {
      return db
        .insert(listingPhotos)
        .values({
          listingId: null,
          uploadedBy: input.uploadedBy,
          url: input.url,
          slot: 'front',
          order: input.order,
        })
        .returning({ id: listingPhotos.id })
    },
  }
}

export type UploadRepository = ReturnType<typeof createUploadRepository>
