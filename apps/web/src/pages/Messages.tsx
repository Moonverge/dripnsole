import { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import { useMessageStore } from '@/stores/message.store'
import { useAuthStore } from '@/stores/auth.store'

export default function Messages() {
  const {
    conversations,
    messages,
    activeConversation,
    fetchConversations,
    fetchMessages,
    sendMessage,
    setActiveConversation,
    respondToOffer,
    offers,
  } = useMessageStore()
  const user = useAuthStore((s) => s.user)
  const [newMessage, setNewMessage] = useState('')
  const [offerAmount, setOfferAmount] = useState('')
  const [showOfferInput, setShowOfferInput] = useState(false)

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  function handleSend() {
    if (!newMessage.trim() || !activeConversation) return
    sendMessage(activeConversation.id, newMessage.trim())
    setNewMessage('')
  }

  function handleSendOffer() {
    if (!offerAmount || !activeConversation) return
    sendMessage(activeConversation.id, `💰 Offer: ₱${Number(offerAmount).toLocaleString()}`)
    setOfferAmount('')
    setShowOfferInput(false)
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-65px)] max-w-[1280px] overflow-hidden md:h-[calc(100vh-73px)]">
      <aside
        className={`${activeConversation ? 'hidden md:flex' : 'flex'} w-full shrink-0 flex-col border-r border-border md:w-80`}
      >
        <div className="border-b border-border px-4 py-4">
          <h1 className="font-martian text-base font-bold">Messages</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <p className="p-4 text-center font-martian text-sm text-text-muted">
              No conversations yet
            </p>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => {
                  setActiveConversation(conv)
                  fetchMessages(conv.id)
                }}
                className={`flex w-full cursor-pointer items-center gap-3 border-b border-border/50 px-4 py-3 text-left transition-colors hover:bg-surface-light ${activeConversation?.id === conv.id ? 'bg-surface-light' : ''}`}
              >
                <img
                  src={conv.listingPhoto}
                  alt=""
                  className="h-12 w-12 shrink-0 rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="truncate font-martian text-sm font-medium">
                      {conv.buyerName}
                    </span>
                    {conv.unreadCount > 0 && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="truncate font-martian text-xs text-text-muted">
                    {conv.listingTitle}
                  </p>
                  <p className="truncate font-martian text-xs text-text-faint">
                    {conv.lastMessage}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      <div className={`${activeConversation ? 'flex' : 'hidden md:flex'} flex-1 flex-col`}>
        {activeConversation ? (
          <>
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <button
                onClick={() => setActiveConversation(null)}
                className="cursor-pointer border-none bg-none p-1 md:hidden"
              >
                <Icon icon="mdi:arrow-left" width={20} />
              </button>
              <img
                src={activeConversation.listingPhoto}
                alt=""
                className="h-10 w-10 rounded-lg object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="truncate font-martian text-sm font-medium">
                  {activeConversation.listingTitle}
                </p>
                <p className="font-martian text-xs text-text-muted">
                  ₱{activeConversation.listingPrice.toLocaleString()} ·{' '}
                  {activeConversation.buyerName}
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex flex-col gap-3">
                {messages.map((msg) => {
                  const isMe = msg.senderId === user?.id
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${isMe ? 'bg-brand text-white' : 'bg-surface-light'}`}
                      >
                        {!isMe && (
                          <p className="mb-0.5 font-martian text-[10px] font-bold">
                            {msg.senderName}
                          </p>
                        )}
                        <p className="font-martian text-sm">{msg.content}</p>
                        <p
                          className={`mt-0.5 font-martian text-[10px] ${isMe ? 'text-white/60' : 'text-text-faint'}`}
                        >
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  )
                })}

                {offers
                  .filter((o) => o.status === 'pending')
                  .map((offer) => (
                    <div
                      key={offer.id}
                      className="mx-auto w-full max-w-sm rounded-xl border border-brand/20 bg-brand/5 p-4 text-center"
                    >
                      <p className="font-martian text-sm font-bold">
                        Offer: ₱{offer.amount.toLocaleString()}
                      </p>
                      <p className="mt-1 font-martian text-xs text-text-muted">
                        from {offer.buyerName}
                      </p>
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => respondToOffer(offer.id, 'accepted')}
                          className="flex-1 cursor-pointer rounded-full bg-accent-green py-2 font-martian text-xs text-white"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => respondToOffer(offer.id, 'declined')}
                          className="flex-1 cursor-pointer rounded-full bg-accent-red py-2 font-martian text-xs text-white"
                        >
                          Decline
                        </button>
                        <button
                          onClick={() => respondToOffer(offer.id, 'countered', offer.amount + 500)}
                          className="flex-1 cursor-pointer rounded-full border border-border py-2 font-martian text-xs"
                        >
                          Counter
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="border-t border-border p-3">
              {showOfferInput ? (
                <div className="flex gap-2">
                  <div className="flex flex-1 items-center rounded-lg border border-border px-3">
                    <span className="font-martian text-sm text-text-muted">₱</span>
                    <input
                      value={offerAmount}
                      onChange={(e) => setOfferAmount(e.target.value)}
                      type="number"
                      className="w-full border-none py-2.5 pl-1 font-martian text-sm outline-none"
                      placeholder="Offer amount"
                      autoFocus
                    />
                  </div>
                  <button
                    onClick={handleSendOffer}
                    className="cursor-pointer rounded-full bg-brand px-4 py-2.5 font-martian text-sm text-white"
                  >
                    Send
                  </button>
                  <button
                    onClick={() => setShowOfferInput(false)}
                    className="cursor-pointer border-none bg-none px-2 font-martian text-sm text-text-muted"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowOfferInput(true)}
                    className="shrink-0 cursor-pointer rounded-full border border-border px-3 py-2.5 transition-colors hover:bg-surface-light"
                    title="Make offer"
                  >
                    <Icon icon="mdi:currency-usd" width={18} />
                  </button>
                  <input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Type a message..."
                    className="flex-1 rounded-full border border-border px-4 py-2.5 font-martian text-sm focus:border-brand focus:outline-none"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!newMessage.trim()}
                    className="cursor-pointer rounded-full bg-brand px-4 py-2.5 font-martian text-sm text-white transition-colors hover:bg-black disabled:opacity-40"
                  >
                    Send
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center">
            <Icon icon="mdi:message-outline" width={48} className="mb-3 text-text-muted" />
            <p className="font-martian text-sm text-text-muted">Select a conversation</p>
          </div>
        )}
      </div>
    </div>
  )
}
