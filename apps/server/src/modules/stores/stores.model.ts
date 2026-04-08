import { z } from 'zod'

export const storeCategoryZ = z.enum([
  'Tops',
  'Bottoms',
  'Shoes',
  'Bags',
  'Accessories',
  'Vintage',
  'Luxury',
])

export const createStoreBodySchema = z.object({
  handle: z.string().min(2).max(40),
  name: z.string().min(1).max(120),
  bio: z.string().max(160).optional(),
  categories: z.array(storeCategoryZ).min(1).max(12),
  pickupInfo: z.string().max(2000).optional(),
  shippingInfo: z.string().max(2000).optional(),
  website: z.string().max(200).optional(),
})

export const updateStoreBodySchema = z.object({
  name: z.string().min(1).max(120).optional(),
  bio: z.string().max(160).optional(),
  pickupInfo: z.string().max(2000).optional(),
  shippingInfo: z.string().max(2000).optional(),
  bannerUrl: z.string().url().max(2000).optional(),
})

export const connectSocialBodySchema = z.object({
  platform: z.enum(['facebook', 'instagram']),
  accessToken: z.string().min(1).max(8000),
  refreshToken: z.string().max(8000).optional(),
  accountName: z.string().max(200).optional(),
})

export type CreateStoreBody = z.infer<typeof createStoreBodySchema>
export type UpdateStoreBody = z.infer<typeof updateStoreBodySchema>
export type ConnectSocialBody = z.infer<typeof connectSocialBodySchema>
export type StoreCategory = z.infer<typeof storeCategoryZ>
