import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User, LoginPayload, RegisterPayload } from '@/types/user'
import { axiosInstance } from '@/utils/axios.instance'
import { AUTH_LOGOUT, AUTH_REFRESH, PROFILE, SIGN_IN, SIGN_UP } from '@/utils/api.routes'
import { clearAccessToken, onSessionCleared, setAccessToken } from '@/utils/access-token'

interface AuthState {
  user: User | null
  isLoading: boolean
}

interface AuthActions {
  login: (payload: LoginPayload) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  logout: () => Promise<void>
  setLoading: (loading: boolean) => void
  becomeSeller: () => void
  refreshProfile: () => Promise<void>
  tryRefreshSession: () => Promise<void>
}

function mapUser(raw: Record<string, unknown>): User {
  return {
    id: String(raw.id),
    email: String(raw.email),
    name: String(raw.name),
    profilePic: raw.profilePic ? String(raw.profilePic) : undefined,
    isSeller: Boolean(raw.isSeller),
    emailVerified: raw.emailVerified !== undefined ? Boolean(raw.emailVerified) : undefined,
    createdAt: String(raw.createdAt),
  }
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,

      login: async (payload: LoginPayload) => {
        set({ isLoading: true })
        try {
          const { data } = await axiosInstance.post<{
            success: boolean
            data?: { accessToken: string; user: User }
          }>(SIGN_IN(), payload)
          if (!data.success || !data.data) {
            throw new Error('Login failed')
          }
          setAccessToken(data.data.accessToken)
          set({
            user: mapUser(data.data.user as unknown as Record<string, unknown>),
            isLoading: false,
          })
        } catch (e) {
          set({ isLoading: false })
          throw e instanceof Error ? e : new Error('Login failed')
        }
      },

      register: async (payload: RegisterPayload) => {
        set({ isLoading: true })
        try {
          const { data } = await axiosInstance.post<{
            success: boolean
            data?: { accessToken: string; user: User }
          }>(SIGN_UP(), payload)
          if (!data.success || !data.data) {
            throw new Error('Registration failed')
          }
          setAccessToken(data.data.accessToken)
          set({
            user: mapUser(data.data.user as unknown as Record<string, unknown>),
            isLoading: false,
          })
        } catch (e) {
          set({ isLoading: false })
          throw e instanceof Error ? e : new Error('Registration failed')
        }
      },

      logout: async () => {
        try {
          await axiosInstance.post(AUTH_LOGOUT())
        } catch {
          void 0
        }
        clearAccessToken()
        set({ user: null })
      },

      setLoading: (loading: boolean) => set({ isLoading: loading }),

      becomeSeller: () => {
        const { user } = get()
        if (user) {
          set({ user: { ...user, isSeller: true } })
        }
      },

      refreshProfile: async () => {
        try {
          const { data } = await axiosInstance.get<{
            success: boolean
            data?: { user: User; hasStore?: boolean }
          }>(PROFILE())
          if (data.success && data.data?.user) {
            set({ user: mapUser(data.data.user as unknown as Record<string, unknown>) })
          }
        } catch {
          void 0
        }
      },

      tryRefreshSession: async () => {
        if (!get().user) return
        try {
          const { data } = await axiosInstance.post<{
            success: boolean
            data?: { accessToken: string }
          }>(AUTH_REFRESH(), {})
          if (data.success && data.data?.accessToken) {
            setAccessToken(data.data.accessToken)
            await get().refreshProfile()
          }
        } catch {
          clearAccessToken()
          set({ user: null })
        }
      },
    }),
    {
      name: 'dripnsole.auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user }),
      onRehydrateStorage: () => () => {
        queueMicrotask(() => {
          void useAuthStore.getState().tryRefreshSession()
        })
      },
    },
  ),
)

onSessionCleared(() => {
  useAuthStore.setState({ user: null })
})
