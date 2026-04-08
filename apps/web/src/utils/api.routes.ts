const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
export const SOCKET_SERVER = BASE_URL.replace('/api', '')

export const SIGN_UP = () => `/auth/register`
export const SIGN_IN = () => `/auth/login`
export const AUTH_REFRESH = () => `/auth/refresh`
export const AUTH_LOGOUT = () => `/auth/logout`
export const AUTH_VERIFY_EMAIL = () => `/auth/verify-email`
export const PROFILE = () => `/auth/me`

export const CREATE_STORE = () => `/stores`
export const GET_STORE_BY_HANDLE = (handle: string) =>
  `/stores/${encodeURIComponent(handle.replace(/^@/, ''))}`
export const UPDATE_STORE_BY_HANDLE = (handle: string) =>
  `/stores/${encodeURIComponent(handle.replace(/^@/, ''))}`
export const CHECK_HANDLE = (handle: string) =>
  `/stores/check-handle/${encodeURIComponent(handle.replace(/^@/, ''))}`
export const FOLLOW_STORE_BY_HANDLE = (handle: string) =>
  `/stores/${encodeURIComponent(handle.replace(/^@/, ''))}/follow`
export const STORE_FOLLOWERS = (handle: string) =>
  `/stores/${encodeURIComponent(handle.replace(/^@/, ''))}/followers`
export const CONNECT_SOCIAL = (handle: string) =>
  `/stores/${encodeURIComponent(handle.replace(/^@/, ''))}/connect-social`

export const CREATE_LISTING = () => `/listings`
export const GET_LISTINGS = () => `/listings`
export const GET_MY_LISTINGS = () => `/listings/me`
export const GET_LISTING_BY_ID = (id: string) => `/listings/${id}`
export const UPDATE_LISTING = (id: string) => `/listings/${id}`
export const DELETE_LISTING = (id: string) => `/listings/${id}`
export const PATCH_LISTING_AVAILABILITY = (id: string) => `/listings/${id}/availability`
export const LISTING_SAVE = (id: string) => `/listings/${id}/save`
export const GET_FEED = () => `/listings/feed`
export const GET_FOLLOWING_FEED = () => `/listings/following`
export const SEARCH_LISTINGS = () => `/listings/search`

export const UPLOAD_PHOTOS = () => `/upload`

export const GET_CONVERSATIONS = () => `/conversations`
export const CREATE_CONVERSATION = () => `/conversations`
export const GET_MESSAGES = (conversationId: string) => `/conversations/${conversationId}/messages`
export const SEND_MESSAGE = (conversationId: string) => `/conversations/${conversationId}/messages`

export const CREATE_OFFER = () => `/offers`
export const PATCH_OFFER = (id: string) => `/offers/${id}`

export const GET_RESERVATIONS = () => `/reservations`
export const CREATE_RESERVATION = () => `/reservations`
export const PATCH_RESERVATION = (id: string) => `/reservations/${id}`

export const GET_COMMENTS = (listingId: string) => `/listings/${listingId}/comments`
export const POST_COMMENT = (listingId: string) => `/listings/${listingId}/comments`
export const DELETE_COMMENT = (id: string) => `/comments/${id}`

export const GET_NOTIFICATIONS = () => `/notifications`
export const MARK_NOTIFICATION_READ = (id: string) => `/notifications/${id}/read`

export { BASE_URL }
