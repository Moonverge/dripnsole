import { z } from 'zod'

export const crossPostPlatformZ = z.enum(['facebook', 'instagram'])
export type CrossPostPlatform = z.infer<typeof crossPostPlatformZ>

export const captionMaxLen = 2200

export const singleCrossPostBodySchema = z.object({
  platforms: z.array(crossPostPlatformZ).min(1).max(2),
  caption: z.string().min(1).max(captionMaxLen),
})

export const bulkCrossPostBodySchema = z.object({
  platforms: z.array(crossPostPlatformZ).min(1).max(2),
  items: z
    .array(
      z.object({
        listingId: z.string().uuid(),
        caption: z.string().min(1).max(captionMaxLen),
      }),
    )
    .min(1)
    .max(20),
})

export const soldCrossPostBodySchema = z.object({
  platforms: z.array(crossPostPlatformZ).min(1).max(2),
  comment: z.string().min(1).max(200).default('SOLD'),
})

export type SingleCrossPostBody = z.infer<typeof singleCrossPostBodySchema>
export type BulkCrossPostBody = z.infer<typeof bulkCrossPostBodySchema>
export type SoldCrossPostBody = z.infer<typeof soldCrossPostBodySchema>

export interface CrossPostDto {
  id: string
  listingId: string
  platform: CrossPostPlatform
  status: 'posting' | 'posted' | 'failed' | 'removed'
  caption: string
  remotePostId: string | null
  remoteUrl: string | null
  errorMessage: string | null
  postedAt: string | null
  createdAt: string
}

export const PER_LISTING_COOLDOWN_SECONDS = 5 * 60
export const PER_SELLER_HOURLY_LIMIT = 30
export const PER_SELLER_DAILY_LIMIT = 50
export const BULK_INTER_POST_DELAY_MS = 30 * 1000
