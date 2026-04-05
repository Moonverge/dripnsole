import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User, LoginPayload, RegisterPayload } from '@/types/user'

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
}

interface AuthActions {
  login: (payload: LoginPayload) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  logout: () => void
  setLoading: (loading: boolean) => void
  becomeSeller: () => void
  refreshProfile: () => Promise<void>
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,

      login: async (payload: LoginPayload) => {
        set({ isLoading: true })
        try {
          await new Promise((r) => setTimeout(r, 800))
          const mockUser: User = {
            id: 'u1',
            email: payload.email,
            name: payload.email.split('@')[0],
            isSeller: true,
            createdAt: new Date().toISOString(),
          }
          set({ user: mockUser, token: 'mock-jwt-token', isLoading: false })
        } catch {
          set({ isLoading: false })
          throw new Error('Invalid credentials')
        }
      },

      register: async (payload: RegisterPayload) => {
        set({ isLoading: true })
        try {
          await new Promise((r) => setTimeout(r, 800))
          const mockUser: User = {
            id: 'u-' + Date.now(),
            email: payload.email,
            name: payload.name,
            isSeller: false,
            createdAt: new Date().toISOString(),
          }
          set({ user: mockUser, token: 'mock-jwt-token', isLoading: false })
        } catch {
          set({ isLoading: false })
          throw new Error('Registration failed')
        }
      },

      logout: () => {
        set({ user: null, token: null })
      },

      setLoading: (loading: boolean) => set({ isLoading: loading }),

      becomeSeller: () => {
        const { user } = get()
        if (user) {
          set({ user: { ...user, isSeller: true } })
        }
      },

      refreshProfile: async () => {
        const { token } = get()
        if (!token) return
        await new Promise((r) => setTimeout(r, 300))
      },
    }),
    {
      name: 'dripnsole.auth',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          state.refreshProfile()
        }
      },
    },
  ),
)
