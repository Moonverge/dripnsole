import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Listing } from '@/types/listing'
import { axiosInstance } from '@/utils/axios.instance'
import { LISTING_SAVE } from '@/utils/api.routes'

interface WishlistState {
  savedIds: string[]
  items: Listing[]
  isLoading: boolean
}

interface WishlistActions {
  fetchWishlist: () => Promise<void>
  toggleSave: (listingId: string) => Promise<void>
  isSaved: (listingId: string) => boolean
}

export const useWishlistStore = create<WishlistState & WishlistActions>()(
  persist(
    (set, get) => ({
      savedIds: [],
      items: [],
      isLoading: false,

      fetchWishlist: async () => {
        set({ isLoading: true })
        set({ isLoading: false })
      },

      toggleSave: async (listingId: string) => {
        const { data } = await axiosInstance.post<{ success: boolean; data?: { saved: boolean } }>(
          LISTING_SAVE(listingId),
        )
        const saved = Boolean(data.data?.saved)
        set((state) => {
          const savedIds = saved
            ? [...new Set([...state.savedIds, listingId])]
            : state.savedIds.filter((id) => id !== listingId)
          return { savedIds }
        })
      },

      isSaved: (listingId: string) => get().savedIds.includes(listingId),
    }),
    {
      name: 'dripnsole.wishlist',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ savedIds: state.savedIds }),
    },
  ),
)
