import { create } from 'zustand'
import type {
  Listing,
  ListingAvailability,
  ListingFilters,
  CreateListingPayload,
} from '@/types/listing'
import { axiosInstance } from '@/utils/axios.instance'
import {
  CREATE_LISTING,
  GET_FEED,
  GET_FOLLOWING_FEED,
  GET_LISTING_BY_ID,
  GET_LISTINGS,
  GET_MY_LISTINGS,
  PATCH_LISTING_AVAILABILITY,
  SEARCH_LISTINGS,
  UPLOAD_PHOTOS,
} from '@/utils/api.routes'

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

function asListing(raw: unknown): Listing {
  return raw as Listing
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
    const f = filters || get().filters
    const params = new URLSearchParams()
    if (f.category) params.set('category', f.category)
    if (f.subcategory) params.set('subcategory', f.subcategory)
    if (f.condition) params.set('condition', f.condition)
    if (f.priceMin != null) params.set('minPrice', String(f.priceMin))
    if (f.priceMax != null) params.set('maxPrice', String(f.priceMax))
    if (f.sizeClothes) params.set('size', f.sizeClothes)
    if (f.sellerBadge) params.set('sellerBadge', f.sellerBadge)
    if (f.sort) params.set('sort', f.sort)
    const qs = params.toString()
    const url = qs ? `${GET_LISTINGS()}?${qs}` : GET_LISTINGS()
    try {
      const { data } = await axiosInstance.get<{
        success: boolean
        data?: { listings: Listing[] }
      }>(url)
      set({
        listings: data.data?.listings?.map(asListing) ?? [],
        filters: f,
        isLoading: false,
      })
    } catch {
      set({ isLoading: false })
    }
  },

  fetchMyListings: async () => {
    set({ isLoading: true })
    try {
      const { data } = await axiosInstance.get<{
        success: boolean
        data?: { listings: Listing[] }
      }>(GET_MY_LISTINGS())
      set({ myListings: data.data?.listings?.map(asListing) ?? [], isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  fetchFeed: async () => {
    set({ isLoading: true })
    try {
      const { data } = await axiosInstance.get<{
        success: boolean
        data?: { listings: Listing[] }
      }>(GET_FEED())
      set({ feedListings: data.data?.listings?.map(asListing) ?? [], isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  fetchFollowingFeed: async () => {
    set({ isLoading: true })
    try {
      const { data } = await axiosInstance.get<{
        success: boolean
        data?: { listings: Listing[] }
      }>(GET_FOLLOWING_FEED())
      set({ followingListings: data.data?.listings?.map(asListing) ?? [], isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  fetchListingById: async (id: string) => {
    set({ isLoading: true })
    try {
      const { data } = await axiosInstance.get<{ success: boolean; data?: { listing: Listing } }>(
        GET_LISTING_BY_ID(id),
      )
      set({
        currentListing: data.data?.listing ? asListing(data.data.listing) : null,
        isLoading: false,
      })
    } catch {
      set({ currentListing: null, isLoading: false })
    }
  },

  createListing: async (payload: CreateListingPayload) => {
    set({ isLoading: true })
    const fd = new FormData()
    for (const file of payload.photos) {
      fd.append('file', file)
    }
    const up = await axiosInstance.post<{ success: boolean; data?: { photos: { id: string }[] } }>(
      UPLOAD_PHOTOS(),
      fd,
    )
    const photoIds = up.data.data?.photos?.map((p) => p.id) ?? []
    if (photoIds.length === 0) {
      set({ isLoading: false })
      throw new Error('Upload failed')
    }
    const { data } = await axiosInstance.post<{ success: boolean; data?: { listing: Listing } }>(
      CREATE_LISTING(),
      {
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
        photoIds,
      },
    )
    const listing = data.data?.listing ? asListing(data.data.listing) : null
    if (!listing) {
      set({ isLoading: false })
      throw new Error('Create failed')
    }
    set((s) => ({
      myListings: [listing, ...s.myListings],
      isLoading: false,
    }))
    return listing
  },

  updateAvailability: async (id: string, availability: ListingAvailability) => {
    await axiosInstance.patch(PATCH_LISTING_AVAILABILITY(id), { availability })
    set((state) => ({
      myListings: state.myListings.map((l) => (l.id === id ? { ...l, availability } : l)),
    }))
  },

  setFilters: (filters: ListingFilters) => set({ filters }),

  searchListings: async (query: string) => {
    set({ isLoading: true })
    const params = new URLSearchParams({ q: query })
    try {
      const { data } = await axiosInstance.get<{
        success: boolean
        data?: { listings: Listing[] }
      }>(`${SEARCH_LISTINGS()}?${params.toString()}`)
      set({ listings: data.data?.listings?.map(asListing) ?? [], isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },
}))
