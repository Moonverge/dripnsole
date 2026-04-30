import type { ServerEnv } from '@dripnsole/config'
import { postFacebookComment } from '../../lib/meta-graph.js'
import { decryptSecret } from '../../lib/social-encrypt.js'
import {
  clearMetaConnection,
  completeMetaOAuth,
  getMetaConnection,
  getMetaOAuthUrl,
} from './cross-posts.meta.js'
import { crossPostSingleListing } from './cross-posts.posting.js'
import type { CrossPostsRepository } from './cross-posts.repository.js'
import {
  BULK_INTER_POST_DELAY_MS,
  type BulkCrossPostBody,
  type CrossPostDto,
  type CrossPostPlatform,
  type SingleCrossPostBody,
  type SoldCrossPostBody,
} from './cross-posts.model.js'

function toDto(row: {
  id: string
  listingId: string
  platform: CrossPostPlatform
  status: 'posting' | 'posted' | 'failed' | 'removed'
  caption: string
  remotePostId: string | null
  remoteUrl: string | null
  errorMessage: string | null
  postedAt: Date | null
  createdAt: Date
}): CrossPostDto {
  return {
    id: row.id,
    listingId: row.listingId,
    platform: row.platform,
    status: row.status,
    caption: row.caption,
    remotePostId: row.remotePostId,
    remoteUrl: row.remoteUrl,
    errorMessage: row.errorMessage,
    postedAt: row.postedAt ? row.postedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  }
}

export function createCrossPostsService(input: { repo: CrossPostsRepository; env: ServerEnv }) {
  const { repo, env } = input

  return {
    async getMetaOAuthUrl(userId: string) {
      return getMetaOAuthUrl({ repo, env, userId })
    },

    getMetaConnection(userId: string) {
      return getMetaConnection({ repo, env, userId })
    },

    async completeMetaOAuth(input: { code: string; state: string }) {
      return completeMetaOAuth({ repo, env, ...input })
    },

    async clearMetaConnection(userId: string) {
      return clearMetaConnection({ repo, env, userId })
    },

    crossPostSingle(input: {
      sellerId: string
      listingId: string
      body: SingleCrossPostBody
    }) {
      return crossPostSingleListing({ repo, env, ...input })
    },

    async crossPostBulk(input: { sellerId: string; body: BulkCrossPostBody }) {
      const srows = await repo.findStoreByUserId(input.sellerId)
      const store = srows[0]
      if (!store) return { kind: 'not_found' as const }
      if (!store.metaPageTokenEncrypted || !store.metaPageId) {
        return { kind: 'not_connected' as const }
      }

      const accepted: { listingId: string; queuedAt: number }[] = []
      const rejected: { listingId: string; reason: string }[] = []

      const ownership: { listingId: string; caption: string }[] = []
      for (const item of input.body.items) {
        const lrows = await repo.findListingForSeller({
          listingId: item.listingId,
          sellerId: input.sellerId,
        })
        const row = lrows[0]
        if (!row) {
          rejected.push({ listingId: item.listingId, reason: 'Listing not found or not owned' })
          continue
        }
        ownership.push({
          listingId: item.listingId,
          caption: item.caption,
        })
      }

      ownership.forEach((o, i) => {
        const delayMs = i * BULK_INTER_POST_DELAY_MS
        accepted.push({ listingId: o.listingId, queuedAt: Date.now() + delayMs })
        setTimeout(() => {
          void crossPostSingleListing({
            repo,
            env,
            sellerId: input.sellerId,
            listingId: o.listingId,
            body: { platforms: input.body.platforms, caption: o.caption },
          }).catch(() => {})
        }, delayMs)
      })

      return { kind: 'ok' as const, accepted, rejected }
    },

    async markSold(input: { sellerId: string; listingId: string; body: SoldCrossPostBody }) {
      const lrows = await repo.findListingForSeller({
        listingId: input.listingId,
        sellerId: input.sellerId,
      })
      const row = lrows[0]
      if (!row) return { kind: 'not_found' as const }
      const { listing, store } = row
      if (!store.metaPageTokenEncrypted) {
        return { kind: 'not_connected' as const }
      }

      let pageToken: string
      try {
        pageToken = decryptSecret(env, store.metaPageTokenEncrypted)
      } catch {
        return { kind: 'not_connected' as const }
      }

      const refs: { platform: CrossPostPlatform; remotePostId: string }[] = []
      for (const platform of input.body.platforms) {
        const last = await repo.latestPostedForListing({ listingId: listing.id, platform })
        if (last[0]?.remotePostId) {
          refs.push({ platform, remotePostId: last[0].remotePostId })
        }
      }
      if (refs.length === 0) {
        return { kind: 'nothing_to_update' as const }
      }

      let updated = 0
      for (const ref of refs) {
        if (ref.platform !== 'facebook') continue
        try {
          await postFacebookComment({
            env,
            objectId: ref.remotePostId,
            pageAccessToken: pageToken,
            message: input.body.comment,
          })
          updated += 1
        } catch {
          return { kind: 'failed' as const, message: 'Could not add sold comment on Facebook.' }
        }
      }

      return { kind: 'ok' as const, data: { updated } }
    },

    async historyForListing(input: { sellerId: string; listingId: string }) {
      const rows = await repo.historyForListing({
        listingId: input.listingId,
        sellerId: input.sellerId,
      })
      return rows.map((r) =>
        toDto({
          id: r.id,
          listingId: r.listingId,
          platform: r.platform as CrossPostPlatform,
          status: r.status as 'posting' | 'posted' | 'failed' | 'removed',
          caption: r.caption,
          remotePostId: r.remotePostId,
          remoteUrl: r.remoteUrl,
          errorMessage: r.errorMessage,
          postedAt: r.postedAt,
          createdAt: r.createdAt,
        }),
      )
    },
  }
}

export type CrossPostsService = ReturnType<typeof createCrossPostsService>
