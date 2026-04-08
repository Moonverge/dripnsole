import { create } from 'zustand'
import type { Conversation, Message, Offer, OfferStatus } from '@/types/message'
import { MOCK_CONVERSATIONS, MOCK_MESSAGES } from '@/utils/mock-data'

interface MessageState {
  conversations: Conversation[]
  messages: Message[]
  activeConversation: Conversation | null
  offers: Offer[]
  isLoading: boolean
}

interface MessageActions {
  fetchConversations: () => Promise<void>
  fetchMessages: (conversationId: string) => Promise<void>
  sendMessage: (conversationId: string, content: string) => Promise<void>
  startConversation: (listingId: string, initialMessage: string) => Promise<void>
  createOffer: (listingId: string, amount: number) => Promise<void>
  respondToOffer: (
    offerId: string,
    action: 'accepted' | 'declined' | 'countered',
    counterAmount?: number,
  ) => Promise<void>
  setActiveConversation: (conversation: Conversation | null) => void
}

export const useMessageStore = create<MessageState & MessageActions>()((set) => ({
  conversations: [],
  messages: [],
  activeConversation: null,
  offers: [],
  isLoading: false,

  fetchConversations: async () => {
    set({ isLoading: true })
    await new Promise((r) => setTimeout(r, 500))
    set({ conversations: MOCK_CONVERSATIONS, isLoading: false })
  },

  fetchMessages: async (conversationId: string) => {
    set({ isLoading: true })
    await new Promise((r) => setTimeout(r, 300))
    const conv = MOCK_CONVERSATIONS.find((c) => c.id === conversationId) || null
    const msgs = MOCK_MESSAGES.filter((m) => m.conversationId === conversationId)
    set({ messages: msgs, activeConversation: conv, isLoading: false })
  },

  sendMessage: async (conversationId: string, content: string) => {
    await new Promise((r) => setTimeout(r, 200))
    const newMsg: Message = {
      id: 'm-' + Date.now(),
      conversationId,
      senderId: 'u1',
      senderName: 'You',
      content,
      createdAt: new Date().toISOString(),
    }
    set((state) => ({ messages: [...state.messages, newMsg] }))
  },

  startConversation: async (listingId: string, initialMessage: string) => {
    await new Promise((r) => setTimeout(r, 500))
    const newConv: Conversation = {
      id: 'c-' + Date.now(),
      listingId,
      listingTitle: 'Listing',
      listingPhoto: '/assets/products/vintageairmax.jpg',
      listingPrice: 0,
      buyerId: 'u1',
      buyerName: 'You',
      sellerId: 'u2',
      sellerName: 'Seller',
      lastMessage: initialMessage,
      lastMessageAt: new Date().toISOString(),
      unreadCount: 0,
    }
    set((state) => ({ conversations: [newConv, ...state.conversations] }))
  },

  createOffer: async (listingId: string, amount: number) => {
    await new Promise((r) => setTimeout(r, 500))
    const offer: Offer = {
      id: 'o-' + Date.now(),
      listingId,
      buyerId: 'u1',
      buyerName: 'You',
      sellerId: 'u2',
      amount,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }
    set((state) => ({ offers: [...state.offers, offer] }))
  },

  respondToOffer: async (offerId: string, action: OfferStatus, counterAmount?: number) => {
    await new Promise((r) => setTimeout(r, 500))
    set((state) => ({
      offers: state.offers.map((o) =>
        o.id === offerId ? { ...o, status: action, counterAmount } : o,
      ),
    }))
  },

  setActiveConversation: (conversation) => set({ activeConversation: conversation }),
}))
