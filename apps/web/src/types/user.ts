export type UserRole = 'buyer' | 'seller' | 'admin'

export interface User {
  id: string
  email: string
  name: string
  profilePic?: string
  role: UserRole
  emailVerified?: boolean
  createdAt: string
}

export interface AuthResponse {
  user: User
  token: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
}
