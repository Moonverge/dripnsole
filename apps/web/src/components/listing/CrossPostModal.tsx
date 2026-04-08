import { useState } from 'react'
import { Icon } from '@iconify/react'
import type { Listing } from '@/types/listing'

interface CrossPostModalProps {
  listings: Listing[]
  storeHandle: string
  onClose: () => void
  onPost: (platforms: ('facebook' | 'instagram')[], caption: string) => Promise<void>
}

function generateCaption(listing: Listing, handle: string): string {
  return `${listing.title}\n₱${listing.price.toLocaleString()} | ${listing.condition} | Size ${listing.size}\n\n🛒 dripnsole.ph/@${handle}\n\n#thriftph #ukayukay #thriftfinds #dripnsole`
}

export default function CrossPostModal({
  listings,
  storeHandle,
  onClose,
  onPost,
}: CrossPostModalProps) {
  const [platforms, setPlatforms] = useState<Set<'facebook' | 'instagram'>>(new Set())
  const [caption, setCaption] = useState(() =>
    listings.length === 1
      ? generateCaption(listings[0], storeHandle)
      : `New drops! ${listings.length} items just listed on DripNSole\n\n🛒 dripnsole.ph/@${storeHandle}\n\n#thriftph #ukayukay #thriftfinds #dripnsole`,
  )
  const [posting, setPosting] = useState(false)
  const [posted, setPosted] = useState(false)

  function togglePlatform(p: 'facebook' | 'instagram') {
    setPlatforms((prev) => {
      const next = new Set(prev)
      if (next.has(p)) next.delete(p)
      else next.add(p)
      return next
    })
  }

  async function handlePost() {
    setPosting(true)
    await onPost([...platforms], caption)
    setPosting(false)
    setPosted(true)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="font-martian text-base font-bold">
            {posted
              ? 'Posted!'
              : `Cross-Post ${listings.length > 1 ? `${listings.length} Items` : 'to Social'}`}
          </h2>
          <button onClick={onClose} className="cursor-pointer border-none bg-none p-1">
            <Icon icon="mdi:close" width={20} />
          </button>
        </div>

        {posted ? (
          <div className="p-6 text-center">
            <Icon icon="mdi:check-circle" width={48} className="mx-auto mb-3 text-accent-green" />
            <p className="font-martian text-sm text-text-muted">
              Successfully posted to {[...platforms].join(' & ')}
            </p>
            <button
              onClick={onClose}
              className="mt-4 cursor-pointer rounded-full bg-black px-6 py-2.5 font-martian text-sm text-white"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="p-6">
            {listings.length === 1 && (
              <div className="mb-4 flex items-center gap-3 rounded-xl border border-border p-3">
                <img
                  src={listings[0].photos[0]?.url}
                  alt=""
                  className="h-14 w-14 rounded-lg object-cover"
                />
                <div>
                  <p className="font-martian text-sm font-medium">{listings[0].title}</p>
                  <p className="font-martian text-xs text-text-muted">
                    ₱{listings[0].price.toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="mb-1.5 block font-martian text-xs font-medium text-text-secondary">
                Caption
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={5}
                className="w-full resize-none rounded-lg border border-border px-4 py-3 font-martian text-sm focus:border-brand focus:outline-none"
              />
            </div>

            <div className="mb-6">
              <label className="mb-2 block font-martian text-xs font-medium text-text-secondary">
                Post to
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => togglePlatform('facebook')}
                  className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border py-3 font-martian text-sm transition-colors ${platforms.has('facebook') ? 'border-[#1877F2] bg-[#1877F2]/5 text-[#1877F2]' : 'border-border hover:bg-surface-light'}`}
                >
                  <Icon icon="mdi:facebook" width={20} />
                  Facebook
                </button>
                <button
                  onClick={() => togglePlatform('instagram')}
                  className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border py-3 font-martian text-sm transition-colors ${platforms.has('instagram') ? 'border-[#E4405F] bg-[#E4405F]/5 text-[#E4405F]' : 'border-border hover:bg-surface-light'}`}
                >
                  <Icon icon="mdi:instagram" width={20} />
                  Instagram
                </button>
              </div>
            </div>

            <button
              onClick={handlePost}
              disabled={platforms.size === 0 || posting}
              className="w-full cursor-pointer rounded-full bg-brand py-3.5 font-martian text-sm font-medium text-white transition-colors hover:bg-black disabled:opacity-40"
            >
              {posting
                ? 'Posting...'
                : `Post to ${platforms.size} Platform${platforms.size !== 1 ? 's' : ''}`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
