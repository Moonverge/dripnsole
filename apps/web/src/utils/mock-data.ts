import type { Listing } from '@/types/listing'
import type { Store } from '@/types/store'
import type { Notification } from '@/types/notification'
import type { Conversation, Message } from '@/types/message'

export const MOCK_STORES: Store[] = [
  {
    id: 's1',
    userId: 'u1',
    handle: 'ThriftByKath',
    name: 'Thrift By Kath',
    bio: 'Curated ukay-ukay finds. Quality secondhand drip from Manila.',
    bannerUrl: '/assets/seller.jpg',
    categories: ['Tops', 'Bottoms', 'Vintage'],
    pickupInfo: 'Meetup at SM North EDSA',
    shippingInfo: 'J&T Express, Lalamove within Metro Manila',
    badge: 'verified',
    rating: 4.8,
    reviewCount: 42,
    completedTransactions: 156,
    followerCount: 1200,
    fbConnected: true,
    igConnected: true,
    createdAt: '2025-06-01T00:00:00Z',
  },
  {
    id: 's2',
    userId: 'u2',
    handle: 'SoleRepublic',
    name: 'Sole Republic',
    bio: 'Authentic sneakers. VNDS and DS pairs only.',
    bannerUrl: '/assets/showcase.jpg',
    categories: ['Shoes'],
    pickupInfo: 'BGC Taguig meetups',
    shippingInfo: 'LBC nationwide, Lalamove Metro Manila',
    badge: 'top',
    rating: 4.9,
    reviewCount: 89,
    completedTransactions: 340,
    followerCount: 3400,
    fbConnected: true,
    igConnected: false,
    createdAt: '2025-03-15T00:00:00Z',
  },
]

export const MOCK_LISTINGS: Listing[] = [
  {
    id: 'l1', storeId: 's1', storeName: 'Thrift By Kath', storeHandle: 'ThriftByKath',
    title: 'Vintage Nike Air Max 97', category: 'Shoes', subcategory: 'Sneakers',
    condition: 'VNDS', size: '10', sizeUnit: 'US',
    measurements: { insoleLength: 28 }, price: 4500, negotiable: true,
    shippingOptions: ['J&T Express', 'Lalamove'],
    description: 'Barely used Air Max 97. Silver Bullet colorway. Comes with OG box.',
    photos: [
      { id: 'p1', url: '/assets/products/vintageairmax.jpg', slot: 'front', order: 0 },
      { id: 'p2', url: '/assets/products/vintageairmax.jpg', slot: 'back', order: 1 },
      { id: 'p3', url: '/assets/products/vintageairmax.jpg', slot: 'left', order: 2 },
      { id: 'p4', url: '/assets/products/vintageairmax.jpg', slot: 'right', order: 3 },
    ],
    availability: 'available', viewCount: 234, saveCount: 45, commentCount: 8,
    createdAt: '2026-03-20T00:00:00Z',
  },
  {
    id: 'l2', storeId: 's2', storeName: 'Sole Republic', storeHandle: 'SoleRepublic',
    title: 'Supreme Box Logo Tee', category: 'Clothes', subcategory: 'Tops',
    condition: 'BNWT', size: 'L',
    measurements: { chest: 56, length: 72 }, price: 6500, negotiable: false,
    shippingOptions: ['LBC', 'Lalamove'],
    description: 'Brand new with tags. FW20 Box Logo. Red on white.',
    photos: [
      { id: 'p5', url: '/assets/products/supremeboxtee.jpg', slot: 'front', order: 0 },
      { id: 'p6', url: '/assets/products/supremeboxtee.jpg', slot: 'back', order: 1 },
      { id: 'p7', url: '/assets/products/supremeboxtee.jpg', slot: 'tag_label', order: 2 },
    ],
    availability: 'available', viewCount: 567, saveCount: 123, commentCount: 15,
    createdAt: '2026-03-22T00:00:00Z',
  },
  {
    id: 'l3', storeId: 's1', storeName: 'Thrift By Kath', storeHandle: 'ThriftByKath',
    title: 'Jordan 1 Retro High Chicago', category: 'Shoes', subcategory: 'Sneakers',
    condition: '9/10', size: '9.5', sizeUnit: 'US',
    measurements: { insoleLength: 27.5 }, price: 12000, negotiable: true,
    shippingOptions: ['J&T Express', 'LBC'],
    description: 'Minor creasing on toebox. No yellowing. Comes with extra laces.',
    photos: [
      { id: 'p8', url: '/assets/products/jordan1chicago.jpg', slot: 'front', order: 0 },
      { id: 'p9', url: '/assets/products/jordan1chicago.jpg', slot: 'back', order: 1 },
      { id: 'p10', url: '/assets/products/jordan1chicago.jpg', slot: 'sole_hem', order: 2 },
      { id: 'p11', url: '/assets/products/jordan1chicago.jpg', slot: 'defect', order: 3 },
    ],
    availability: 'reserved', viewCount: 890, saveCount: 201, commentCount: 32,
    createdAt: '2026-03-18T00:00:00Z',
  },
  {
    id: 'l4', storeId: 's2', storeName: 'Sole Republic', storeHandle: 'SoleRepublic',
    title: 'Bape Shark Hoodie', category: 'Clothes', subcategory: 'Outerwear',
    condition: '8/10', size: 'M',
    measurements: { chest: 54, length: 68 }, price: 8500, negotiable: true,
    shippingOptions: ['Lalamove', 'LBC'],
    description: 'Classic full-zip shark hoodie. Minor pilling. Still iconic.',
    photos: [
      { id: 'p12', url: '/assets/products/bapehoodie.jpg', slot: 'front', order: 0 },
      { id: 'p13', url: '/assets/products/bapehoodie.jpg', slot: 'back', order: 1 },
      { id: 'p14', url: '/assets/products/bapehoodie.jpg', slot: 'detail', order: 2 },
    ],
    availability: 'available', viewCount: 445, saveCount: 87, commentCount: 11,
    createdAt: '2026-03-25T00:00:00Z',
  },
  {
    id: 'l5', storeId: 's1', storeName: 'Thrift By Kath', storeHandle: 'ThriftByKath',
    title: 'Vintage Band Tee — Metallica', category: 'Clothes', subcategory: 'Tops',
    condition: 'Thrifted', size: 'XL',
    measurements: { chest: 60, length: 76 }, price: 1200, negotiable: true,
    shippingOptions: ['J&T Express'],
    description: 'Authentic vintage Metallica ride the lightning tee. Faded wash.',
    photos: [
      { id: 'p15', url: '/assets/products/vintageband.jpg', slot: 'front', order: 0 },
      { id: 'p16', url: '/assets/products/vintageband.jpg', slot: 'back', order: 1 },
    ],
    availability: 'available', viewCount: 178, saveCount: 34, commentCount: 5,
    createdAt: '2026-04-01T00:00:00Z',
  },
  {
    id: 'l6', storeId: 's2', storeName: 'Sole Republic', storeHandle: 'SoleRepublic',
    title: 'Levis 501 Original Fit', category: 'Clothes', subcategory: 'Bottoms',
    condition: '7/10', size: '32',
    measurements: { waist: 82, inseam: 80, length: 105 }, price: 1800, negotiable: true,
    shippingOptions: ['J&T Express', 'Lalamove'],
    description: 'Classic straight fit. Some natural distressing. Great fade.',
    photos: [
      { id: 'p17', url: '/assets/products/levis.jpg', slot: 'front', order: 0 },
      { id: 'p18', url: '/assets/products/levis.jpg', slot: 'back', order: 1 },
      { id: 'p19', url: '/assets/products/levis.jpg', slot: 'tag_label', order: 2 },
    ],
    availability: 'sold', viewCount: 312, saveCount: 56, commentCount: 9,
    createdAt: '2026-03-10T00:00:00Z',
  },
  {
    id: 'l7', storeId: 's1', storeName: 'Thrift By Kath', storeHandle: 'ThriftByKath',
    title: 'Champion Reverse Weave Sweatshirt', category: 'Clothes', subcategory: 'Tops',
    condition: 'Thrifted', size: 'L',
    measurements: { chest: 58, length: 70 }, price: 950, negotiable: true,
    shippingOptions: ['J&T Express'],
    description: 'Heavyweight reverse weave crewneck. Minimal wear.',
    photos: [
      { id: 'p20', url: '/assets/products/championsweatshirt.jpg', slot: 'front', order: 0 },
      { id: 'p21', url: '/assets/products/championsweatshirt.jpg', slot: 'back', order: 1 },
    ],
    availability: 'available', viewCount: 89, saveCount: 12, commentCount: 2,
    createdAt: '2026-04-02T00:00:00Z',
  },
  {
    id: 'l8', storeId: 's2', storeName: 'Sole Republic', storeHandle: 'SoleRepublic',
    title: 'Nike Tech Fleece Joggers', category: 'Clothes', subcategory: 'Bottoms',
    condition: 'VNDS', size: 'M',
    measurements: { waist: 78, inseam: 74, length: 100 }, price: 2200, negotiable: false,
    shippingOptions: ['LBC', 'Lalamove'],
    description: 'Worn twice. Black colorway. Tapered fit.',
    photos: [
      { id: 'p22', url: '/assets/products/niketechfleece.jpg', slot: 'front', order: 0 },
      { id: 'p23', url: '/assets/products/niketechfleece.jpg', slot: 'back', order: 1 },
      { id: 'p24', url: '/assets/products/niketechfleece.jpg', slot: 'tag_label', order: 2 },
    ],
    availability: 'available', viewCount: 203, saveCount: 41, commentCount: 6,
    createdAt: '2026-04-03T00:00:00Z',
  },
]

export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'c1', listingId: 'l1', listingTitle: 'Vintage Nike Air Max 97',
    listingPhoto: '/assets/products/vintageairmax.jpg', listingPrice: 4500,
    buyerId: 'u3', buyerName: 'Miguel Santos', sellerId: 'u1', sellerName: 'Kath',
    lastMessage: 'Is this still available?', lastMessageAt: '2026-04-04T14:30:00Z', unreadCount: 1,
  },
  {
    id: 'c2', listingId: 'l3', listingTitle: 'Jordan 1 Retro High Chicago',
    listingPhoto: '/assets/products/jordan1chicago.jpg', listingPrice: 12000,
    buyerId: 'u4', buyerName: 'Jessa Reyes', sellerId: 'u1', sellerName: 'Kath',
    lastMessage: 'Can you do ₱10,000?', lastMessageAt: '2026-04-04T12:00:00Z', unreadCount: 0,
  },
]

export const MOCK_MESSAGES: Message[] = [
  { id: 'm1', conversationId: 'c1', senderId: 'u3', senderName: 'Miguel Santos', content: 'Hi! Is this still available?', createdAt: '2026-04-04T14:30:00Z' },
  { id: 'm2', conversationId: 'c1', senderId: 'u1', senderName: 'Kath', content: 'Yes, it is! Are you interested?', createdAt: '2026-04-04T14:32:00Z' },
  { id: 'm3', conversationId: 'c1', senderId: 'u3', senderName: 'Miguel Santos', content: 'Can I get more photos of the sole?', createdAt: '2026-04-04T14:35:00Z' },
  { id: 'm4', conversationId: 'c2', senderId: 'u4', senderName: 'Jessa Reyes', content: 'Interested in the Chicagos!', createdAt: '2026-04-04T11:00:00Z' },
  { id: 'm5', conversationId: 'c2', senderId: 'u1', senderName: 'Kath', content: 'Great taste! What size are you?', createdAt: '2026-04-04T11:05:00Z' },
  { id: 'm6', conversationId: 'c2', senderId: 'u4', senderName: 'Jessa Reyes', content: 'Can you do ₱10,000?', createdAt: '2026-04-04T12:00:00Z' },
]

export const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 'n1', userId: 'u1', type: 'new_offer', title: 'New Offer', body: 'Miguel Santos offered ₱4,000 for Vintage Nike Air Max 97', linkTo: '/messages', read: false, createdAt: '2026-04-04T15:00:00Z' },
  { id: 'n2', userId: 'u1', type: 'new_comment', title: 'New Comment', body: 'Jessa commented on Jordan 1 Chicago', linkTo: '/listing/l3', read: false, createdAt: '2026-04-04T13:00:00Z' },
  { id: 'n3', userId: 'u1', type: 'new_listing_followed', title: 'New Drip', body: 'Sole Republic just dropped Nike Tech Fleece Joggers', linkTo: '/listing/l8', read: true, createdAt: '2026-04-03T10:00:00Z' },
  { id: 'n4', userId: 'u1', type: 'reservation_confirmed', title: 'Reserved', body: 'Your reservation for Jordan 1 Chicago has been confirmed', linkTo: '/listing/l3', read: true, createdAt: '2026-04-02T09:00:00Z' },
]
