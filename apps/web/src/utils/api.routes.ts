const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
export const SOCKET_SERVER = BASE_URL.replace('/api', '')

export const SIGN_UP = () => `/auth/register`
export const SIGN_IN = () => `/auth/login`
export const PROFILE = () => `/auth/me`

export const CREATE_STORE = () => `/stores`
export const GET_STORE_BY_HANDLE = (handle: string) => `/stores/@${handle}`
export const GET_MY_STORE = () => `/stores/me`
export const UPDATE_STORE = (storeId: string) => `/stores/${storeId}`
export const CHECK_HANDLE = (handle: string) => `/stores/check-handle/${handle}`
export const FOLLOW_STORE = (storeId: string) => `/stores/${storeId}/follow`
export const UNFOLLOW_STORE = (storeId: string) => `/stores/${storeId}/unfollow`

export const CREATE_LISTING = () => `/listings`
export const GET_LISTINGS = () => `/listings`
export const GET_LISTING_BY_ID = (id: string) => `/listings/${id}`
export const UPDATE_LISTING = (id: string) => `/listings/${id}`
export const DELETE_LISTING = (id: string) => `/listings/${id}`
export const GET_MY_LISTINGS = () => `/listings/me`
export const GET_STORE_LISTINGS = (storeId: string) => `/stores/${storeId}/listings`
export const GET_FEED = () => `/listings/feed`
export const GET_FOLLOWING_FEED = () => `/listings/following`
export const SEARCH_LISTINGS = () => `/listings/search`

export const CROSS_POST = () => `/social/cross-post`
export const CONNECT_FACEBOOK = () => `/social/connect/facebook`
export const CONNECT_INSTAGRAM = () => `/social/connect/instagram`
export const DISCONNECT_SOCIAL = (platform: string) => `/social/disconnect/${platform}`

export const GET_CONVERSATIONS = () => `/messages/conversations`
export const GET_MESSAGES = (conversationId: string) => `/messages/${conversationId}`
export const SEND_MESSAGE = (conversationId: string) => `/messages/${conversationId}`
export const START_CONVERSATION = () => `/messages/conversations`

export const CREATE_OFFER = (listingId: string) => `/offers/${listingId}`
export const RESPOND_OFFER = (offerId: string) => `/offers/${offerId}/respond`

export const ADD_TO_WISHLIST = (listingId: string) => `/wishlist/${listingId}`
export const REMOVE_FROM_WISHLIST = (listingId: string) => `/wishlist/${listingId}`
export const GET_WISHLIST = () => `/wishlist`

export const GET_COMMENTS = (listingId: string) => `/listings/${listingId}/comments`
export const POST_COMMENT = (listingId: string) => `/listings/${listingId}/comments`

export const CREATE_RESERVATION = (listingId: string) => `/listings/${listingId}/reserve`

export const GET_NOTIFICATIONS = () => `/notifications`
export const MARK_NOTIFICATION_READ = (id: string) => `/notifications/${id}/read`
export const MARK_ALL_READ = () => `/notifications/read-all`

export { BASE_URL }
