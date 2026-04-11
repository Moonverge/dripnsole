import { create } from 'zustand'
import type { Listing } from '@/types/listing'
import type { Store, StoreSetupPayload, SocialConnection } from '@/types/store'
import { axiosInstance } from '@/utils/axios.instance'
import {
  CHECK_HANDLE,
  CONNECT_SOCIAL,
  CREATE_STORE,
  FOLLOW_STORE_BY_HANDLE,
  GET_STORE_BY_HANDLE,
  PROFILE,
} from '@/utils/api.routes'

interface StoreState {
  myStore: Store | null
  viewedStore: Store | null
  viewedStoreListings: Listing[]
  isLoading: boolean
  socialConnections: SocialConnection[]
}

interface StoreActions {
  createStore: (payload: StoreSetupPayload) => Promise<void>
  fetchMyStore: () => Promise<void>
  fetchStoreByHandle: (handle: string) => Promise<void>
  checkHandleAvailability: (handle: string) => Promise<boolean>
  connectSocial: (platform: 'facebook' | 'instagram') => Promise<void>
  disconnectSocial: (platform: 'facebook' | 'instagram') => Promise<void>
  followStore: (handle: string) => Promise<void>
  unfollowStore: (handle: string) => Promise<void>
}

function mapStore(raw: Record<string, unknown>): Store {
  return {
    id: String(raw.id),
    userId: raw.userId ? String(raw.userId) : '',
    handle: String(raw.handle),
    name: String(raw.name),
    bio: raw.bio != null ? String(raw.bio) : '',
    bannerUrl: raw.bannerUrl ? String(raw.bannerUrl) : undefined,
    categories: (raw.categories as Store['categories']) ?? [],
    pickupInfo: raw.pickupInfo != null ? String(raw.pickupInfo) : '',
    shippingInfo: raw.shippingInfo != null ? String(raw.shippingInfo) : '',
    badge: (raw.badge as Store['badge']) ?? 'new',
    rating: Number(raw.rating) || 0,
    reviewCount: Number(raw.reviewCount) || 0,
    completedTransactions: Number(raw.completedTransactions) || 0,
    followerCount: Number(raw.followerCount) || 0,
    fbConnected: Boolean(raw.fbConnected),
    igConnected: Boolean(raw.igConnected),
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
  }
}

export const useStoreStore = create<StoreState & StoreActions>()((set, get) => ({
  myStore: null,
  viewedStore: null,
  viewedStoreListings: [],
  isLoading: false,
  socialConnections: [],

  createStore: async (payload: StoreSetupPayload) => {
    set({ isLoading: true })
    const { data } = await axiosInstance.post<{
      success: boolean
      data?: { store: Record<string, unknown>; accessToken?: string }
    }>(CREATE_STORE(), {
      handle: payload.handle,
      name: payload.name,
      bio: payload.bio,
      categories: payload.categories,
      pickupInfo: payload.pickupInfo,
      shippingInfo: payload.shippingInfo,
    })
    if (data.data?.accessToken) {
      const { useAuthStore } = await import('@/stores/auth.store')
      useAuthStore.getState().upgradeToSeller(data.data.accessToken)
    }
    await get().fetchMyStore()
    set({ isLoading: false })
  },

  fetchMyStore: async () => {
    set({ isLoading: true })
    try {
      const { data } = await axiosInstance.get<{
        success: boolean
        data?: { hasStore?: boolean; store?: Record<string, unknown> }
      }>(PROFILE())
      if (data.success && data.data?.hasStore && data.data.store) {
        set({ myStore: mapStore(data.data.store), isLoading: false })
      } else {
        set({ myStore: null, isLoading: false })
      }
    } catch {
      set({ isLoading: false })
    }
  },

  fetchStoreByHandle: async (handle: string) => {
    set({ isLoading: true })
    try {
      const h = handle.replace(/^@/, '')
      const { data } = await axiosInstance.get<{
        success: boolean
        data?: { store: Record<string, unknown>; listings: Listing[] }
      }>(GET_STORE_BY_HANDLE(h))
      if (data.success && data.data?.store) {
        set({
          viewedStore: mapStore(data.data.store),
          viewedStoreListings: data.data.listings ?? [],
          isLoading: false,
        })
      } else {
        set({ viewedStore: null, viewedStoreListings: [], isLoading: false })
      }
    } catch {
      set({ viewedStore: null, viewedStoreListings: [], isLoading: false })
    }
  },

  checkHandleAvailability: async (handle: string) => {
    const h = handle.replace(/^@/, '')
    const { data } = await axiosInstance.get<{ success: boolean; data?: { available: boolean } }>(
      CHECK_HANDLE(h),
    )
    return Boolean(data.data?.available)
  },

  connectSocial: async (platform) => {
    const my = get().myStore
    if (!my) return
    await axiosInstance.post(CONNECT_SOCIAL(my.handle), {
      platform,
      accessToken: 'placeholder',
    })
    set((state) => ({
      socialConnections: [
        ...state.socialConnections.filter((c) => c.platform !== platform),
        {
          platform,
          connected: true,
          accountName: `@${platform}`,
          connectedAt: new Date().toISOString(),
        },
      ],
    }))
  },

  disconnectSocial: async (platform) => {
    set((state) => ({
      socialConnections: state.socialConnections.filter((c) => c.platform !== platform),
    }))
  },

  followStore: async (handle: string) => {
    const h = handle.replace(/^@/, '')
    await axiosInstance.post(FOLLOW_STORE_BY_HANDLE(h))
  },

  unfollowStore: async (handle: string) => {
    const h = handle.replace(/^@/, '')
    await axiosInstance.post(FOLLOW_STORE_BY_HANDLE(h))
  },
}))
