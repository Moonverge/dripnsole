import { sanitizePlainText } from '../../lib/sanitize-text.js'
import { parseUuidV4 } from '../../lib/uuid-v4.js'
import type { CommentsRepository } from './comments.repository.js'
import type { PostCommentBody } from './comments.model.js'

type ListRow = Awaited<ReturnType<CommentsRepository['listForListing']>>[number]

export function createCommentsService(repo: CommentsRepository) {
  return {
    async listForListing(listingIdRaw: string, limit: number) {
      let listingId: string
      try {
        listingId = parseUuidV4(listingIdRaw)
      } catch {
        return { kind: 'bad_id' as const }
      }
      const fetched = await repo.listForListing(listingId, limit + 1)
      const hasMore = fetched.length > limit
      const rows = hasMore ? fetched.slice(0, limit) : fetched
      const nextCursor = hasMore ? fetched[limit]!.id : null
      const roots = rows.filter((r) => !r.parentId)
      const children = rows.filter((r) => r.parentId)
      const byParent = new Map<string, ListRow[]>()
      for (const c of children) {
        if (!c.parentId) continue
        const arr = byParent.get(c.parentId) ?? []
        arr.push(c)
        byParent.set(c.parentId, arr)
      }
      return {
        kind: 'ok' as const,
        nextCursor,
        comments: roots.map((r) => ({
          id: r.id,
          userId: r.userId,
          content: r.content,
          createdAt: r.createdAt.toISOString(),
          replies: (byParent.get(r.id) ?? []).map((c) => ({
            id: c.id,
            userId: c.userId,
            content: c.content,
            createdAt: c.createdAt.toISOString(),
          })),
        })),
      }
    },

    async create(userId: string, listingIdRaw: string, body: PostCommentBody) {
      let listingId: string
      try {
        listingId = parseUuidV4(listingIdRaw)
      } catch {
        return { kind: 'bad_id' as const }
      }
      const content = sanitizePlainText(body.content)
      let parentId: string | null = null
      if (body.parentId) {
        try {
          parentId = parseUuidV4(body.parentId)
        } catch {
          return { kind: 'bad_parent' as const }
        }
        const prow = await repo.findCommentById(parentId)
        const p = prow[0]
        if (!p || p.listingId !== listingId || p.parentId) {
          return { kind: 'bad_thread' as const }
        }
      }
      const lrows = await repo.findListingById(listingId)
      if (!lrows[0] || lrows[0].deletedAt) {
        return { kind: 'not_found' as const }
      }
      const inserted = await repo.insertComment({
        listingId,
        userId,
        parentId,
        content,
      })
      await repo.incrementListingCommentCount(listingId)
      const row = inserted[0]
      return {
        kind: 'ok' as const,
        comment: row
          ? {
              id: row.id,
              userId,
              content,
              createdAt: row.createdAt.toISOString(),
              parentId,
            }
          : null,
      }
    },

    async delete(userId: string, idRaw: string) {
      let id: string
      try {
        id = parseUuidV4(idRaw)
      } catch {
        return { kind: 'bad_id' as const }
      }
      const crows = await repo.findCommentById(id)
      const c = crows[0]
      if (!c || c.deletedAt) {
        return { kind: 'not_found' as const }
      }
      const lrows = await repo.findListingById(c.listingId)
      const listing = lrows[0]
      if (!listing) {
        return { kind: 'not_found' as const }
      }
      const srows = await repo.findStoreById(listing.storeId)
      const store = srows[0]
      const isAuthor = c.userId === userId
      const isOwner = store?.userId === userId
      if (!isAuthor && !isOwner) {
        return { kind: 'forbidden' as const }
      }
      await repo.softDeleteComment(id)
      await repo.decrementListingCommentCount(c.listingId)
      return { kind: 'ok' as const }
    },
  }
}

export type CommentsService = ReturnType<typeof createCommentsService>
