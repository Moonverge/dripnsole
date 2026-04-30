import { randomUUID } from 'node:crypto'
import type { ServerEnv } from '@dripnsole/config'
import {
  publishFacebookPagePhoto,
  publishInstagramFeedPhoto,
} from '../../lib/meta-graph.js'
import { decryptSecret } from '../../lib/social-encrypt.js'
import type { CrossPostsRepository } from './cross-posts.repository.js'
import {
  PER_LISTING_COOLDOWN_SECONDS,
  PER_SELLER_DAILY_LIMIT,
  PER_SELLER_HOURLY_LIMIT,
  type CrossPostPlatform,
  type SingleCrossPostBody,
} from './cross-posts.model.js'

interface PlatformOutcome {
  platform: CrossPostPlatform
  status: 'posted' | 'failed' | 'posting'
  crossPostId: string
  remoteUrl?: string | null
  error?: string
}

async function checkRateLimits(input: {
  repo: CrossPostsRepository
  listingId: string
  sellerId: string
  platforms: CrossPostPlatform[]
}) {
  for (const platform of input.platforms) {
    const recent = await input.repo.findRecentForListing({
      listingId: input.listingId,
      platform,
      sinceMs: PER_LISTING_COOLDOWN_SECONDS * 1000,
    })
    if (recent[0] && recent[0].status !== 'failed') {
      const next = new Date(recent[0].createdAt.getTime() + PER_LISTING_COOLDOWN_SECONDS * 1000)
      return {
        ok: false as const,
        code: 'COOLDOWN' as const,
        message: `Please wait until ${next.toISOString()} before re-posting to ${platform}.`,
      }
    }
  }
  const hourCount = await input.repo.countSellerInWindow(input.sellerId, 60 * 60 * 1000)
  if ((hourCount[0]?.count ?? 0) + input.platforms.length > PER_SELLER_HOURLY_LIMIT) {
    return {
      ok: false as const,
      code: 'HOURLY_LIMIT' as const,
      message: `Hourly limit of ${PER_SELLER_HOURLY_LIMIT} cross-posts reached.`,
    }
  }
  const dayCount = await input.repo.countSellerInWindow(input.sellerId, 24 * 60 * 60 * 1000)
  if ((dayCount[0]?.count ?? 0) + input.platforms.length > PER_SELLER_DAILY_LIMIT) {
    return {
      ok: false as const,
      code: 'DAILY_LIMIT' as const,
      message: `Daily limit of ${PER_SELLER_DAILY_LIMIT} cross-posts reached.`,
    }
  }
  return { ok: true as const }
}

export async function crossPostSingleListing(input: {
  repo: CrossPostsRepository
  env: ServerEnv
  sellerId: string
  listingId: string
  body: SingleCrossPostBody
}) {
  const lrows = await input.repo.findListingForSeller({
    listingId: input.listingId,
    sellerId: input.sellerId,
  })
  const row = lrows[0]
  if (!row) return { kind: 'not_found' as const }
  const { listing, store } = row
  if (!store.metaPageTokenEncrypted || !store.metaPageId) {
    return { kind: 'not_connected' as const }
  }
  const limit = await checkRateLimits({
    repo: input.repo,
    listingId: listing.id,
    sellerId: input.sellerId,
    platforms: input.body.platforms,
  })
  if (!limit.ok) {
    return { kind: 'rate_limited' as const, code: limit.code, message: limit.message }
  }

  const photos = await input.repo.findPhotosForListing(listing.id)
  const imageUrl = photos[0]?.url
  if (!imageUrl) {
    return { kind: 'no_photos' as const }
  }

  let pageToken: string
  try {
    pageToken = decryptSecret(input.env, store.metaPageTokenEncrypted)
  } catch {
    return { kind: 'not_connected' as const }
  }

  const ids = new Map<CrossPostPlatform, string>()
  for (const platform of input.body.platforms) {
    const id = randomUUID()
    ids.set(platform, id)
    await input.repo.insertAttempt({
      id,
      listingId: listing.id,
      storeId: store.id,
      sellerId: input.sellerId,
      platform,
      caption: input.body.caption,
    })
  }

  const outcomes: PlatformOutcome[] = []

  for (const platform of input.body.platforms) {
    const id = ids.get(platform)!
    try {
      if (platform === 'facebook') {
        const r = await publishFacebookPagePhoto({
          env: input.env,
          pageId: store.metaPageId,
          pageAccessToken: pageToken,
          imageUrl,
          message: input.body.caption,
        })
        await input.repo.markPosted({
          id,
          remotePostId: r.postId,
          remoteUrl: r.permalink,
          postedAt: new Date(),
        })
        outcomes.push({
          platform,
          status: 'posted',
          crossPostId: id,
          remoteUrl: r.permalink,
        })
      } else {
        if (!store.metaIgUserId) {
          await input.repo.markFailed({
            id,
            error: 'Instagram Business not linked to this Facebook Page.',
          })
          outcomes.push({
            platform,
            status: 'failed',
            crossPostId: id,
            error: 'Instagram Business not linked to this Facebook Page.',
          })
          continue
        }
        const r = await publishInstagramFeedPhoto({
          env: input.env,
          igUserId: store.metaIgUserId,
          pageAccessToken: pageToken,
          imageUrl,
          caption: input.body.caption,
        })
        await input.repo.markPosted({
          id,
          remotePostId: r.mediaId,
          remoteUrl: r.permalink,
          postedAt: new Date(),
        })
        outcomes.push({
          platform,
          status: 'posted',
          crossPostId: id,
          remoteUrl: r.permalink,
        })
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      await input.repo.markFailed({ id, error: msg })
      outcomes.push({ platform, status: 'failed', crossPostId: id, error: msg })
    }
  }

  return { kind: 'ok' as const, outcomes }
}
