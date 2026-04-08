import { z } from 'zod'
import { listings, stores } from '../../db/schema.js'
import {
  conditionFromDb,
  conditionToDb,
  type ListingCondition,
} from '../../lib/listing-condition.js'

export const conditionZ = z.enum(['BNWT', 'BNWOT', 'VNDS', '9/10', '8/10', '7/10', 'Thrifted'])

export const createListingBodySchema = z.object({
  title: z.string().min(1).max(200),
  category: z.enum(['Clothes', 'Shoes']),
  subcategory: z.string().min(1).max(80),
  condition: conditionZ,
  size: z.string().min(1).max(40),
  sizeUnit: z.enum(['EU', 'US', 'UK']).optional(),
  measurements: z.record(z.number()).optional(),
  price: z.number().int().min(0).max(9_999_999),
  negotiable: z.boolean(),
  shippingOptions: z.array(z.string().max(80)).max(20),
  description: z.string().max(5000),
  photoIds: z.array(z.string()).min(1).max(8),
  website: z.string().max(200).optional(),
})

export const updateListingBodySchema = createListingBodySchema.partial().extend({
  photoIds: z.array(z.string()).min(1).max(8).optional(),
})

export const availabilityBodySchema = z.object({
  availability: z.enum(['available', 'reserved', 'sold']),
})

export type CreateListingBody = z.infer<typeof createListingBodySchema>
export type UpdateListingBody = z.infer<typeof updateListingBodySchema>

export type ListingRow = typeof listings.$inferSelect
export type StoreRow = typeof stores.$inferSelect

export type ListingPhotoSlice = { id: string; url: string; slot: string; order: number }

export type ListingListQuery = {
  limit: number
  cursor?: string
  category?: string
  subcategory?: string
  condition?: string
  minPrice?: string
  maxPrice?: string
  size?: string
  sellerBadge?: string
  sort?: string
}

export function toListingDto(
  l: ListingRow,
  storeRow: StoreRow,
  photos: ListingPhotoSlice[],
): Record<string, unknown> {
  return {
    id: l.id,
    storeId: l.storeId,
    storeName: storeRow.name,
    storeHandle: storeRow.handle,
    title: l.title,
    category: l.category,
    subcategory: l.subcategory,
    condition: conditionFromDb(String(l.condition)) as ListingCondition,
    size: l.size ?? '',
    sizeUnit: l.sizeUnit ?? undefined,
    measurements: (l.measurements as Record<string, number> | null) ?? {},
    price: l.price,
    negotiable: l.negotiable,
    shippingOptions: l.shippingOptions,
    description: l.description ?? '',
    photos,
    availability: l.availability,
    viewCount: l.viewCount,
    saveCount: l.saveCount,
    commentCount: l.commentCount,
    createdAt: l.createdAt.toISOString(),
  }
}

export function sortPhotosForDto(
  photos: { id: string; url: string; slot: string; order: number }[],
): ListingPhotoSlice[] {
  return [...photos].sort((a, b) => a.order - b.order)
}

export { conditionToDb, type ListingCondition }
