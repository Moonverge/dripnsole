export type OfferStatus = 'pending' | 'accepted' | 'countered' | 'declined'

export interface Offer {
  id: string
  listingId: string
  buyerId: string
  buyerName: string
  sellerId: string
  amount: number
  counterAmount?: number
  status: OfferStatus
  createdAt: string
}

export interface Message {
  id: string
  conversationId: string
  senderId: string
  senderName: string
  content: string
  offerId?: string
  createdAt: string
}

export interface Conversation {
  id: string
  listingId: string
  listingTitle: string
  listingPhoto: string
  listingPrice: number
  buyerId: string
  buyerName: string
  sellerId: string
  sellerName: string
  lastMessage?: string
  lastMessageAt?: string
  unreadCount: number
}
