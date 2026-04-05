import { create } from 'zustand'
import type { Store, StoreSetupPayload, SocialConnection } from '@/types/store'
import { MOCK_STORES } from '@/utils/mock-data'

interface StoreState {
  myStore: Store | null
  viewedStore: Store | null
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
  followStore: (storeId: string) => Promise<void>
  unfollowStore: (storeId: string) => Promise<void>
}

export const useStoreStore = create<StoreState & StoreActions>()((set) => ({
  myStore: null,
  viewedStore: null,
  isLoading: false,
  socialConnections: [],

  createStore: async (payload: StoreSetupPayload) => {
    set({ isLoading: true })
    await new Promise((r) => setTimeout(r, 1000))
    const newStore: Store = {
      id: 's-' + Date.now(),
      userId: 'u1',
      handle: payload.handle,
      name: payload.name,
      bio: payload.bio,
      bannerUrl: payload.banner ? URL.createObjectURL(payload.banner) : undefined,
      categories: payload.categories,
      pickupInfo: payload.pickupInfo,
      shippingInfo: payload.shippingInfo,
      badge: 'new',
      rating: 0,
      reviewCount: 0,
      completedTransactions: 0,
      followerCount: 0,
      fbConnected: false,
      igConnected: false,
      createdAt: new Date().toISOString(),
    }
    set({ myStore: newStore, isLoading: false })
  },

  fetchMyStore: async () => {
    set({ isLoading: true })
    await new Promise((r) => setTimeout(r, 500))
    set({ myStore: MOCK_STORES[0], isLoading: false })
  },

  fetchStoreByHandle: async (handle: string) => {
    set({ isLoading: true })
    await new Promise((r) => setTimeout(r, 500))
    const found = MOCK_STORES.find((s) => s.handle.toLowerCase() === handle.toLowerCase())
    set({ viewedStore: found || null, isLoading: false })
  },

  checkHandleAvailability: async (handle: string) => {
    await new Promise((r) => setTimeout(r, 300))
    const taken = MOCK_STORES.some((s) => s.handle.toLowerCase() === handle.toLowerCase())
    return !taken
  },

  connectSocial: async (platform) => {
    await new Promise((r) => setTimeout(r, 1000))
    set((state) => ({
      socialConnections: [
        ...state.socialConnections.filter((c) => c.platform !== platform),
        { platform, connected: true, accountName: `@dripnsole_${platform}`, connectedAt: new Date().toISOString() },
      ],
    }))
  },

  disconnectSocial: async (platform) => {
    await new Promise((r) => setTimeout(r, 500))
    set((state) => ({
      socialConnections: state.socialConnections.filter((c) => c.platform !== platform),
    }))
  },

  followStore: async (_storeId: string) => {
    await new Promise((r) => setTimeout(r, 300))
  },

  unfollowStore: async (_storeId: string) => {
    await new Promise((r) => setTimeout(r, 300))
  },
}))
