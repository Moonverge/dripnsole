export interface Review {
  id: string
  reviewerId: string
  reviewerName: string
  reviewerPic?: string
  storeId: string
  listingId: string
  rating: number
  comment: string
  createdAt: string
}
