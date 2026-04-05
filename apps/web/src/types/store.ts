export type SellerBadge = 'new' | 'verified' | 'top'

export type StoreCategory =
  | 'Tops'
  | 'Bottoms'
  | 'Shoes'
  | 'Bags'
  | 'Accessories'
  | 'Vintage'
  | 'Luxury'

export interface Store {
  id: string
  userId: string
  handle: string
  name: string
  bio: string
  bannerUrl?: string
  categories: StoreCategory[]
  pickupInfo: string
  shippingInfo: string
  badge: SellerBadge
  rating: number
  reviewCount: number
  completedTransactions: number
  followerCount: number
  fbConnected: boolean
  igConnected: boolean
  createdAt: string
}

export interface StoreSetupPayload {
  handle: string
  name: string
  bio: string
  banner?: File
  categories: StoreCategory[]
  pickupInfo: string
  shippingInfo: string
}

export interface SocialConnection {
  platform: 'facebook' | 'instagram'
  connected: boolean
  accountName?: string
  connectedAt?: string
}
