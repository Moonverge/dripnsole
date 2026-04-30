import { create } from 'zustand'
import { axiosInstance } from '@/utils/axios.instance'
import {
  CROSS_POST_BULK,
  CROSS_POST_LISTING,
  CROSS_POST_LISTING_SOLD,
  CROSS_POST_META,
  CROSS_POST_META_OAUTH_URL,
} from '@/utils/api.routes'
import type {
  BulkCrossPostItem,
  CrossPost,
  CrossPostOutcome,
  CrossPostPlatform,
  MetaConnection,
} from '@/types/cross-post'

export interface BulkCrossPostResult {
  accepted: { listingId: string; queuedAt?: number }[]
  rejected: { listingId: string; reason: string }[]
}

interface CrossPostState {
  meta: MetaConnection | null
  metaLoading: boolean
  metaError: string | null
  posting: boolean
  historyByListing: Record<string, CrossPost[]>
}

interface CrossPostActions {
  fetchMeta: () => Promise<void>
  fetchOAuthUrl: () => Promise<string | null>
  clearMeta: () => Promise<void>
  postSingle: (input: {
    listingId: string
    platforms: CrossPostPlatform[]
    caption: string
  }) => Promise<{ ok: boolean; outcomes?: CrossPostOutcome[]; error?: string }>
  postBulk: (input: {
    platforms: CrossPostPlatform[]
    items: BulkCrossPostItem[]
  }) => Promise<{ ok: boolean; result?: BulkCrossPostResult; error?: string }>
  postSold: (input: {
    listingId: string
    platforms: CrossPostPlatform[]
    comment?: string
  }) => Promise<{ ok: boolean; updated?: number; error?: string }>
  fetchHistory: (listingId: string) => Promise<void>
}

function axiosError(e: unknown): string {
  const ax = e as { response?: { data?: { error?: string } } }
  return ax.response?.data?.error ?? (e instanceof Error ? e.message : 'Request failed')
}

export const useCrossPostStore = create<CrossPostState & CrossPostActions>()((set, get) => ({
  meta: null,
  metaLoading: false,
  metaError: null,
  posting: false,
  historyByListing: {},

  fetchMeta: async () => {
    set({ metaLoading: true, metaError: null })
    try {
      const { data } = await axiosInstance.get<{ success: boolean; data?: MetaConnection }>(
        CROSS_POST_META(),
      )
      set({ meta: data.data ?? null, metaLoading: false })
    } catch (e) {
      set({ metaLoading: false, metaError: axiosError(e) })
    }
  },

  fetchOAuthUrl: async () => {
    try {
      const { data } = await axiosInstance.get<{ success: boolean; data?: { url: string } }>(
        CROSS_POST_META_OAUTH_URL(),
      )
      return data.data?.url ?? null
    } catch {
      return null
    }
  },

  clearMeta: async () => {
    set({ metaLoading: true, metaError: null })
    try {
      await axiosInstance.delete(CROSS_POST_META())
      set({ meta: null, metaLoading: false })
    } catch (e) {
      set({ metaLoading: false, metaError: axiosError(e) })
      throw e
    }
  },

  postSingle: async (input) => {
    set({ posting: true })
    try {
      const { data } = await axiosInstance.post<{
        success: boolean
        data?: { outcomes: CrossPostOutcome[] }
      }>(CROSS_POST_LISTING(input.listingId), {
        platforms: input.platforms,
        caption: input.caption,
      })
      set({ posting: false })
      return { ok: true, outcomes: data.data?.outcomes ?? [] }
    } catch (e) {
      set({ posting: false })
      return { ok: false, error: axiosError(e) }
    }
  },

  postBulk: async (input) => {
    set({ posting: true })
    try {
      const { data } = await axiosInstance.post<{
        success: boolean
        data?: {
          accepted: { listingId: string; queuedAt?: number }[]
          rejected: { listingId: string; reason: string }[]
        }
      }>(CROSS_POST_BULK(), {
        platforms: input.platforms,
        items: input.items,
      })
      set({ posting: false })
      return {
        ok: true,
        result: {
          accepted: data.data?.accepted ?? [],
          rejected: data.data?.rejected ?? [],
        },
      }
    } catch (e) {
      set({ posting: false })
      return { ok: false, error: axiosError(e) }
    }
  },

  postSold: async (input) => {
    try {
      const { data } = await axiosInstance.post<{ success: boolean; data?: { updated: number } }>(
        CROSS_POST_LISTING_SOLD(input.listingId),
        {
          platforms: input.platforms,
          comment: input.comment ?? 'SOLD',
        },
      )
      return { ok: true, updated: data.data?.updated ?? 0 }
    } catch (e) {
      return { ok: false, error: axiosError(e) }
    }
  },

  fetchHistory: async (listingId: string) => {
    try {
      const { data } = await axiosInstance.get<{
        success: boolean
        data?: { crossPosts: CrossPost[] }
      }>(CROSS_POST_LISTING(listingId))
      set((state) => ({
        historyByListing: {
          ...state.historyByListing,
          [listingId]: data.data?.crossPosts ?? [],
        },
      }))
    } catch {
      void 0
    }
  },
}))
