import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '@iconify/react'
import type { Listing } from '@/types/listing'
import type { CrossPostOutcome, CrossPostPlatform } from '@/types/cross-post'
import { type BulkCrossPostResult, useCrossPostStore } from '@/stores/cross-post.store'
import { generateCaption } from '@/utils/caption'

const CAPTION_MAX = 2200

interface CrossPostModalProps {
  listings: Listing[]
  storeHandle: string
  onClose: () => void
  onPosted?: () => void
}

interface PerItem {
  listingId: string
  caption: string
}

export default function CrossPostModal({
  listings,
  storeHandle,
  onClose,
  onPosted,
}: CrossPostModalProps) {
  const { meta, fetchMeta, postSingle, postBulk, posting } = useCrossPostStore()
  const isBulk = listings.length > 1

  const [platforms, setPlatforms] = useState<Set<CrossPostPlatform>>(
    new Set(['facebook', 'instagram']),
  )
  const [items, setItems] = useState<PerItem[]>(() =>
    listings.map((l) => ({ listingId: l.id, caption: generateCaption(l, storeHandle) })),
  )
  const [excluded, setExcluded] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [outcomes, setOutcomes] = useState<CrossPostOutcome[] | null>(null)
  const [bulkResult, setBulkResult] = useState<BulkCrossPostResult | null>(null)

  useEffect(() => {
    fetchMeta()
  }, [fetchMeta])

  const connected = Boolean(meta?.connected)
  const includedItems = useMemo(
    () => items.filter((i) => !excluded.has(i.listingId)),
    [items, excluded],
  )
  const listingsById = useMemo(() => new Map(listings.map((l) => [l.id, l])), [listings])

  function togglePlatform(p: CrossPostPlatform) {
    setPlatforms((prev) => {
      const next = new Set(prev)
      if (next.has(p)) next.delete(p)
      else next.add(p)
      return next
    })
  }

  function toggleExcluded(listingId: string) {
    setExcluded((prev) => {
      const next = new Set(prev)
      if (next.has(listingId)) next.delete(listingId)
      else next.add(listingId)
      return next
    })
  }

  function setCaptionFor(listingId: string, caption: string) {
    setItems((prev) =>
      prev.map((i) =>
        i.listingId === listingId ? { ...i, caption: caption.slice(0, CAPTION_MAX) } : i,
      ),
    )
  }

  function resetCaptionFor(listingId: string) {
    const l = listingsById.get(listingId)
    if (!l) return
    setCaptionFor(listingId, generateCaption(l, storeHandle))
  }

  async function handlePost() {
    setError(null)
    if (platforms.size === 0) {
      setError('Pick at least one platform.')
      return
    }
    if (includedItems.some((i) => !i.caption.trim())) {
      setError('Every item needs a caption.')
      return
    }
    const platformList = [...platforms]

    if (isBulk) {
      const r = await postBulk({
        platforms: platformList,
        items: includedItems,
      })
      if (!r.ok) {
        setError(r.error ?? 'Failed to queue posts')
        return
      }
      setBulkResult(r.result ?? { accepted: [], rejected: [] })
      onPosted?.()
      return
    }

    const r = await postSingle({
      listingId: includedItems[0].listingId,
      platforms: platformList,
      caption: includedItems[0].caption,
    })
    if (!r.ok) {
      setError(r.error ?? 'Failed to post')
      return
    }
    setOutcomes(r.outcomes ?? [])
    onPosted?.()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="font-martian text-base font-bold">
            {bulkResult
              ? 'Queued'
              : outcomes
                ? 'Result'
                : isBulk
                  ? `Post ${listings.length} listings to social`
                  : `Post "${listings[0]?.title ?? ''}" to social`}
          </h2>
          <button onClick={onClose} className="cursor-pointer border-none bg-none p-1">
            <Icon icon="mdi:close" width={20} />
          </button>
        </div>

        {!connected ? (
          <div className="p-8 text-center">
            <Icon icon="mdi:link-variant-off" width={40} className="mx-auto mb-3 text-text-muted" />
            <p className="mb-4 font-martian text-sm text-text-secondary">
              Connect your Facebook Page and Instagram Business account in Settings first (Meta login).
            </p>
            <Link
              to="/dashboard/settings"
              onClick={onClose}
              className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-2.5 font-martian text-sm text-white no-underline hover:bg-black"
            >
              Open Settings
              <Icon icon="mdi:arrow-right" width={16} />
            </Link>
          </div>
        ) : bulkResult ? (
          <div className="p-8 text-center">
            <Icon icon="mdi:playlist-check" width={48} className="mx-auto mb-3 text-accent-green" />
            <p className="font-martian text-sm font-medium">
              {bulkResult.accepted.length} queued
              {bulkResult.rejected.length > 0 ? `, ${bulkResult.rejected.length} rejected` : ''}
            </p>
            <p className="mt-1 font-martian text-xs text-text-muted">
              Posts go out 30s apart to stay within Meta's rate limits. Track status in the Listings
              tab.
            </p>
            <div className="mt-5 max-h-72 overflow-y-auto text-left">
              {items.map((item) => {
                const listing = listingsById.get(item.listingId)
                const rejected = bulkResult.rejected.find((r) => r.listingId === item.listingId)
                const accepted = bulkResult.accepted.find((r) => r.listingId === item.listingId)
                const excludedItem = excluded.has(item.listingId)
                const status = rejected
                  ? 'Rejected'
                  : accepted
                    ? 'Queued'
                    : excludedItem
                      ? 'Skipped'
                      : 'Waiting'
                return (
                  <div
                    key={item.listingId}
                    className="mb-2 flex items-center gap-3 rounded-xl border border-border px-3 py-2"
                  >
                    <img
                      src={listing?.photos[0]?.url}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-martian text-xs font-medium">
                        {listing?.title ?? item.listingId}
                      </p>
                      <p
                        className={`font-martian text-[10px] ${rejected ? 'text-accent-red' : accepted ? 'text-accent-green' : 'text-text-muted'}`}
                      >
                        {status}
                        {rejected ? `: ${rejected.reason}` : ''}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
            <button
              onClick={onClose}
              className="mt-5 cursor-pointer rounded-full bg-black px-6 py-2.5 font-martian text-sm text-white"
            >
              Done
            </button>
          </div>
        ) : outcomes ? (
          <div className="p-6">
            {outcomes.map((o) => (
              <div
                key={o.crossPostId}
                className={`mb-2 flex items-center gap-3 rounded-xl border p-3 ${o.status === 'posted' ? 'border-accent-green bg-green-50' : o.status === 'failed' ? 'border-accent-red bg-red-50' : 'border-border bg-surface-light'}`}
              >
                <Icon
                  icon={o.platform === 'facebook' ? 'mdi:facebook' : 'mdi:instagram'}
                  width={22}
                  className={o.platform === 'facebook' ? 'text-[#1877F2]' : 'text-[#E4405F]'}
                />
                <div className="flex-1">
                  <p className="font-martian text-sm font-medium capitalize">
                    {o.platform}:{' '}
                    {o.status === 'posted'
                      ? 'Posted ✓'
                      : o.status === 'failed'
                        ? 'Failed'
                        : 'In progress'}
                  </p>
                  {o.error && <p className="font-martian text-xs text-accent-red">{o.error}</p>}
                  {o.remoteUrl && (
                    <a
                      href={o.remoteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-martian text-xs text-text-link no-underline hover:underline"
                    >
                      View post ↗
                    </a>
                  )}
                </div>
              </div>
            ))}
            <button
              onClick={onClose}
              className="mt-4 w-full cursor-pointer rounded-full bg-black py-3 font-martian text-sm text-white"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(90vh - 64px)' }}>
            {error && (
              <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 font-martian text-sm text-accent-red">
                {error}
              </div>
            )}

            <div className="mb-5">
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

            <div className="mb-5">
              <label className="mb-2 block font-martian text-xs font-medium text-text-secondary">
                {isBulk
                  ? `Captions (${includedItems.length} of ${items.length} included)`
                  : 'Caption'}
              </label>
              <div className="flex flex-col gap-3">
                {items.map((item) => {
                  const listing = listingsById.get(item.listingId)
                  if (!listing) return null
                  const isExcluded = excluded.has(item.listingId)
                  return (
                    <div
                      key={item.listingId}
                      className={`rounded-xl border p-3 ${isExcluded ? 'border-border bg-surface-light/40 opacity-60' : 'border-border'}`}
                    >
                      <div className="mb-2 flex items-center gap-3">
                        {isBulk && (
                          <input
                            type="checkbox"
                            checked={!isExcluded}
                            onChange={() => toggleExcluded(item.listingId)}
                            className="h-4 w-4 accent-brand"
                          />
                        )}
                        <img
                          src={listing.photos[0]?.url}
                          alt=""
                          className="h-10 w-10 shrink-0 rounded-lg object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-martian text-sm font-medium">
                            {listing.title}
                          </p>
                          <p className="font-martian text-xs text-text-muted">
                            ₱{listing.price.toLocaleString()} · {listing.condition}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => resetCaptionFor(item.listingId)}
                          className="cursor-pointer border-none bg-none font-martian text-[10px] text-text-link hover:underline"
                        >
                          Reset
                        </button>
                      </div>
                      <textarea
                        value={item.caption}
                        onChange={(e) => setCaptionFor(item.listingId, e.target.value)}
                        rows={isBulk ? 4 : 6}
                        disabled={isExcluded}
                        className="w-full resize-none rounded-lg border border-border px-3 py-2.5 font-martian text-xs focus:border-brand focus:outline-none disabled:bg-surface-light"
                      />
                      <div className="mt-1 text-right font-martian text-[10px] text-text-faint">
                        {item.caption.length} / {CAPTION_MAX}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <p className="mb-4 rounded-lg bg-surface-light px-3 py-2 font-martian text-[10px] text-text-muted">
              ⓘ Each network receives the first listing photo with your caption. Instagram requires a
              public image URL (JPEG).
            </p>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 cursor-pointer rounded-full border border-border py-3 font-martian text-sm transition-colors hover:bg-surface-light"
              >
                Cancel
              </button>
              <button
                onClick={handlePost}
                disabled={posting || platforms.size === 0 || includedItems.length === 0}
                className="flex-1 cursor-pointer rounded-full bg-brand py-3 font-martian text-sm font-medium text-white transition-colors hover:bg-black disabled:opacity-40"
              >
                {posting
                  ? 'Posting…'
                  : isBulk
                    ? `Post ${includedItems.length} listing${includedItems.length === 1 ? '' : 's'}`
                    : `Post to ${platforms.size} platform${platforms.size === 1 ? '' : 's'}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
