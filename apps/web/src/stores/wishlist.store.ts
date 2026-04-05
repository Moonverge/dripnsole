import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Listing } from '@/types/listing'
import { MOCK_LISTINGS } from '@/utils/mock-data'

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
        await new Promise((r) => setTimeout(r, 400))
        const { savedIds } = get()
        const items = MOCK_LISTINGS.filter((l) => savedIds.includes(l.id))
        set({ items, isLoading: false })
      },

      toggleSave: async (listingId: string) => {
        await new Promise((r) => setTimeout(r, 200))
        set((state) => {
          const alreadySaved = state.savedIds.includes(listingId)
          const savedIds = alreadySaved
            ? state.savedIds.filter((id) => id !== listingId)
            : [...state.savedIds, listingId]
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
