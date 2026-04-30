import { useState } from 'react'
import { Icon } from '@iconify/react'
import type { CrossPost, CrossPostPlatform } from '@/types/cross-post'
import { useCrossPostStore } from '@/stores/cross-post.store'

interface MarkSoldModalProps {
  listingId: string
  listingTitle: string
  history: CrossPost[]
  onClose: () => void
  onDone: () => void
}

export default function MarkSoldModal({
  listingId,
  listingTitle,
  history,
  onClose,
  onDone,
}: MarkSoldModalProps) {
  const { postSold } = useCrossPostStore()

  const fbPosted = history.some((h) => h.platform === 'facebook' && h.status === 'posted')
  const igPosted = history.some((h) => h.platform === 'instagram' && h.status === 'posted')

  const [platforms, setPlatforms] = useState<Set<CrossPostPlatform>>(() => {
    const s = new Set<CrossPostPlatform>()
    if (fbPosted) s.add('facebook')
    if (igPosted) s.add('instagram')
    return s
  })
  const [comment, setComment] = useState('SOLD ✅')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggle(p: CrossPostPlatform) {
    setPlatforms((prev) => {
      const next = new Set(prev)
      if (next.has(p)) next.delete(p)
      else next.add(p)
      return next
    })
  }

  async function handleSubmit() {
    if (platforms.size === 0) {
      onClose()
      return
    }
    setSubmitting(true)
    setError(null)
    const r = await postSold({
      listingId,
      platforms: [...platforms],
      comment,
    })
    setSubmitting(false)
    if (!r.ok) {
      setError(r.error ?? 'Failed to update')
      return
    }
    onDone()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="font-martian text-base font-bold">Mark SOLD on FB/IG too?</h2>
          <button onClick={onClose} className="cursor-pointer border-none bg-none p-1">
            <Icon icon="mdi:close" width={20} />
          </button>
        </div>
        <div className="p-6">
          <p className="mb-4 font-martian text-sm text-text-secondary">
            "{listingTitle}" is marked SOLD on DripNSole. Add a SOLD comment on your existing FB/IG
            posts so buyers know it's no longer available.
          </p>

          {error && (
            <div className="mb-3 rounded-lg bg-red-50 px-4 py-3 font-martian text-sm text-accent-red">
              {error}
            </div>
          )}

          <div className="mb-4 flex flex-col gap-2">
            <label
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${fbPosted ? 'border-border cursor-pointer' : 'border-border bg-surface-light/50 opacity-50'}`}
            >
              <input
                type="checkbox"
                checked={platforms.has('facebook')}
                onChange={() => fbPosted && toggle('facebook')}
                disabled={!fbPosted}
                className="h-4 w-4 accent-brand"
              />
              <Icon icon="mdi:facebook" width={20} className="text-[#1877F2]" />
              <span className="font-martian text-sm">
                {fbPosted ? 'Comment SOLD on Facebook post' : 'Not posted to Facebook'}
              </span>
            </label>
            <label
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${igPosted ? 'border-border cursor-pointer' : 'border-border bg-surface-light/50 opacity-50'}`}
            >
              <input
                type="checkbox"
                checked={platforms.has('instagram')}
                onChange={() => igPosted && toggle('instagram')}
                disabled={!igPosted}
                className="h-4 w-4 accent-brand"
              />
              <Icon icon="mdi:instagram" width={20} className="text-[#E4405F]" />
              <span className="font-martian text-sm">
                {igPosted ? 'Comment SOLD on Instagram post' : 'Not posted to Instagram'}
              </span>
            </label>
          </div>

          <div className="mb-5">
            <label className="mb-1 block font-martian text-xs font-medium text-text-secondary">
              Comment text
            </label>
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={200}
              className="w-full rounded-lg border border-border px-4 py-2.5 font-martian text-sm focus:border-brand focus:outline-none"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 cursor-pointer rounded-full border border-border py-3 font-martian text-sm transition-colors hover:bg-surface-light"
            >
              Skip
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || platforms.size === 0}
              className="flex-1 cursor-pointer rounded-full bg-brand py-3 font-martian text-sm text-white transition-colors hover:bg-black disabled:opacity-40"
            >
              {submitting ? 'Updating…' : 'Update'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
