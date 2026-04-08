import { create } from 'zustand'
import type { Notification } from '@/types/notification'
import { MOCK_NOTIFICATIONS } from '@/utils/mock-data'

interface NotificationState {
  notifications: Notification[]
  isLoading: boolean
}

interface NotificationActions {
  fetchNotifications: () => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
  unreadCount: () => number
}

export const useNotificationStore = create<NotificationState & NotificationActions>()(
  (set, get) => ({
    notifications: [],
    isLoading: false,

    fetchNotifications: async () => {
      set({ isLoading: true })
      await new Promise((r) => setTimeout(r, 300))
      set({ notifications: MOCK_NOTIFICATIONS, isLoading: false })
    },

    markAsRead: async (id: string) => {
      await new Promise((r) => setTimeout(r, 200))
      set((state) => ({
        notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
      }))
    },

    markAllRead: async () => {
      await new Promise((r) => setTimeout(r, 200))
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
      }))
    },

    unreadCount: () => get().notifications.filter((n) => !n.read).length,
  }),
)
