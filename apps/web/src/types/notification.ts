export type NotificationType =
  | 'new_comment'
  | 'new_dm'
  | 'new_offer'
  | 'offer_accepted'
  | 'offer_declined'
  | 'offer_countered'
  | 'reservation_confirmed'
  | 'reservation_expired'
  | 'new_listing_followed'
  | 'price_drop'
  | 'item_sold'

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  body: string
  linkTo: string
  read: boolean
  createdAt: string
}
