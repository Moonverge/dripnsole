export type ListingCondition = 'BNWT' | 'BNWOT' | 'VNDS' | '9/10' | '8/10' | '7/10' | 'Thrifted'

export type ListingAvailability = 'available' | 'reserved' | 'sold'

export type ListingCategory = 'Clothes' | 'Shoes'

export type ClothesSubcategory = 'Tops' | 'Bottoms' | 'Dresses' | 'Outerwear' | 'Accessories'

export type ShoesSubcategory = 'Sneakers' | 'Heels' | 'Flats' | 'Boots' | 'Sandals'

export type SizeClothes = 'XS' | 'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL' | '4XL' | '5XL'

export type SizeUnit = 'EU' | 'US' | 'UK'

export interface ListingPhoto {
  id: string
  url: string
  slot: PhotoSlot
  order: number
}

export type PhotoSlot =
  | 'front'
  | 'back'
  | 'left'
  | 'right'
  | 'sole_hem'
  | 'tag_label'
  | 'defect'
  | 'detail'

export interface Measurements {
  chest?: number
  length?: number
  waist?: number
  hips?: number
  inseam?: number
  insoleLength?: number
}

export interface Listing {
  id: string
  storeId: string
  storeName: string
  storeHandle: string
  title: string
  category: ListingCategory
  subcategory: ClothesSubcategory | ShoesSubcategory
  condition: ListingCondition
  size: string
  sizeUnit?: SizeUnit
  measurements: Measurements
  price: number
  negotiable: boolean
  shippingOptions: string[]
  description: string
  photos: ListingPhoto[]
  availability: ListingAvailability
  viewCount: number
  saveCount: number
  commentCount: number
  createdAt: string
}

export interface CreateListingPayload {
  title: string
  category: ListingCategory
  subcategory: ClothesSubcategory | ShoesSubcategory
  condition: ListingCondition
  size: string
  sizeUnit?: SizeUnit
  measurements: Measurements
  price: number
  negotiable: boolean
  shippingOptions: string[]
  description: string
  photos: File[]
}

export interface CrossPostPayload {
  listingIds: string[]
  platforms: ('facebook' | 'instagram')[]
  caption: string
}

export type ListingSortOption = 'newest' | 'price_asc' | 'price_desc' | 'most_saved'

export interface ListingFilters {
  category?: ListingCategory
  subcategory?: string
  condition?: ListingCondition
  sizeClothes?: SizeClothes
  priceMin?: number
  priceMax?: number
  sellerBadge?: string
  query?: string
  sort?: ListingSortOption
}
