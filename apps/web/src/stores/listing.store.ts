import { create } from 'zustand'
import type { Listing, ListingAvailability, ListingFilters, CreateListingPayload } from '@/types/listing'
import { MOCK_LISTINGS } from '@/utils/mock-data'

interface ListingState {
  listings: Listing[]
  myListings: Listing[]
  feedListings: Listing[]
  followingListings: Listing[]
  currentListing: Listing | null
  filters: ListingFilters
  isLoading: boolean
}

interface ListingActions {
  fetchListings: (filters?: ListingFilters) => Promise<void>
  fetchMyListings: () => Promise<void>
  fetchFeed: () => Promise<void>
  fetchFollowingFeed: () => Promise<void>
  fetchListingById: (id: string) => Promise<void>
  createListing: (payload: CreateListingPayload) => Promise<Listing>
  updateAvailability: (id: string, availability: ListingAvailability) => Promise<void>
  setFilters: (filters: ListingFilters) => void
  searchListings: (query: string) => Promise<void>
}

function applyFilters(listings: Listing[], filters: ListingFilters): Listing[] {
  let result = [...listings]

  if (filters.category) result = result.filter((l) => l.category === filters.category)
  if (filters.subcategory) result = result.filter((l) => l.subcategory === filters.subcategory)
  if (filters.condition) result = result.filter((l) => l.condition === filters.condition)
  if (filters.priceMin) result = result.filter((l) => l.price >= filters.priceMin!)
  if (filters.priceMax) result = result.filter((l) => l.price <= filters.priceMax!)
  if (filters.query) {
    const q = filters.query.toLowerCase()
    result = result.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        l.storeName.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q),
    )
  }

  switch (filters.sort) {
    case 'price_asc': result.sort((a, b) => a.price - b.price); break
    case 'price_desc': result.sort((a, b) => b.price - a.price); break
    case 'most_saved': result.sort((a, b) => b.saveCount - a.saveCount); break
    default: result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  return result
}

export const useListingStore = create<ListingState & ListingActions>()((set, get) => ({
  listings: [],
  myListings: [],
  feedListings: [],
  followingListings: [],
  currentListing: null,
  filters: {},
  isLoading: false,

  fetchListings: async (filters?: ListingFilters) => {
    set({ isLoading: true })
    await new Promise((r) => setTimeout(r, 500))
    const f = filters || get().filters
    set({ listings: applyFilters(MOCK_LISTINGS, f), filters: f, isLoading: false })
  },

  fetchMyListings: async () => {
    set({ isLoading: true })
    await new Promise((r) => setTimeout(r, 500))
    set({ myListings: MOCK_LISTINGS.filter((l) => l.storeId === 's1'), isLoading: false })
  },

  fetchFeed: async () => {
    set({ isLoading: true })
    await new Promise((r) => setTimeout(r, 500))
    const shuffled = [...MOCK_LISTINGS].sort(() => Math.random() - 0.5)
    set({ feedListings: shuffled, isLoading: false })
  },

  fetchFollowingFeed: async () => {
    set({ isLoading: true })
    await new Promise((r) => setTimeout(r, 500))
    set({ followingListings: MOCK_LISTINGS.filter((l) => l.storeId === 's2'), isLoading: false })
  },

  fetchListingById: async (id: string) => {
    set({ isLoading: true })
    await new Promise((r) => setTimeout(r, 300))
    const found = MOCK_LISTINGS.find((l) => l.id === id) || null
    set({ currentListing: found, isLoading: false })
  },

  createListing: async (payload: CreateListingPayload) => {
    set({ isLoading: true })
    await new Promise((r) => setTimeout(r, 1000))
    const newListing: Listing = {
      id: 'l-' + Date.now(),
      storeId: 's1',
      storeName: 'Thrift By Kath',
      storeHandle: 'ThriftByKath',
      title: payload.title,
      category: payload.category,
      subcategory: payload.subcategory,
      condition: payload.condition,
      size: payload.size,
      sizeUnit: payload.sizeUnit,
      measurements: payload.measurements,
      price: payload.price,
      negotiable: payload.negotiable,
      shippingOptions: payload.shippingOptions,
      description: payload.description,
      photos: payload.photos.map((f, i) => ({
        id: `p-${Date.now()}-${i}`,
        url: URL.createObjectURL(f),
        slot: 'front' as const,
        order: i,
      })),
      availability: 'available',
      viewCount: 0,
      saveCount: 0,
      commentCount: 0,
      createdAt: new Date().toISOString(),
    }
    set((state) => ({
      myListings: [newListing, ...state.myListings],
      isLoading: false,
    }))
    return newListing
  },

  updateAvailability: async (id: string, availability: ListingAvailability) => {
    await new Promise((r) => setTimeout(r, 300))
    set((state) => ({
      myListings: state.myListings.map((l) =>
        l.id === id ? { ...l, availability } : l,
      ),
    }))
  },

  setFilters: (filters: ListingFilters) => set({ filters }),

  searchListings: async (query: string) => {
    set({ isLoading: true })
    await new Promise((r) => setTimeout(r, 400))
    set({ listings: applyFilters(MOCK_LISTINGS, { query }), isLoading: false })
  },
}))
