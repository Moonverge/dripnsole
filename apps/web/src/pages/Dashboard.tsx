import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { useListingStore } from '@/stores/listing.store'
import { useStoreStore } from '@/stores/store.store'
import { useCrossPostStore } from '@/stores/cross-post.store'
import type { ListingAvailability, Listing } from '@/types/listing'
import CrossPostModal from '@/components/listing/CrossPostModal'
import CrossPostStatusPill from '@/components/listing/CrossPostStatusPill'
import MarkSoldModal from '@/components/listing/MarkSoldModal'

export default function Dashboard() {
  const location = useLocation()
  const { myListings, fetchMyListings, updateAvailability } = useListingStore()
  const { myStore, fetchMyStore } = useStoreStore()
  const { meta, fetchMeta, fetchHistory, historyByListing } = useCrossPostStore()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [crossPostListings, setCrossPostListings] = useState<Listing[] | null>(null)
  const [soldPrompt, setSoldPrompt] = useState<Listing | null>(null)

  useEffect(() => {
    fetchMyListings()
    fetchMyStore()
    fetchMeta()
  }, [fetchMyListings, fetchMyStore, fetchMeta])

  useEffect(() => {
    for (const l of myListings) {
      if (!historyByListing[l.id]) {
        fetchHistory(l.id)
      }
    }
  }, [myListings, fetchHistory, historyByListing])

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleBulkCrossPost() {
    const selected = myListings.filter((l) => selectedIds.has(l.id))
    if (selected.length === 0) return
    if (selected.length > 20) {
      alert('Bulk post is limited to 20 listings at a time.')
      return
    }
    setCrossPostListings(selected)
  }

  async function handleAvailabilityChange(listing: Listing, value: ListingAvailability) {
    const wasAvailable = listing.availability !== 'sold'
    await updateAvailability(listing.id, value)
    if (value === 'sold' && wasAvailable) {
      const history = historyByListing[listing.id] ?? []
      const everPosted = history.some((h) => h.status === 'posted')
      if (everPosted) {
        setSoldPrompt(listing)
      }
    }
  }

  const totalViews = myListings.reduce((s, l) => s + l.viewCount, 0)
  const totalSaves = myListings.reduce((s, l) => s + l.saveCount, 0)
  const soldCount = myListings.filter((l) => l.availability === 'sold').length
  const connected = Boolean(meta?.connected)
  const section = location.pathname.endsWith('/listings')
    ? 'listings'
    : location.pathname.endsWith('/social')
      ? 'social'
      : 'overview'
  const failedPosts = myListings.reduce(
    (sum, l) => sum + (historyByListing[l.id] ?? []).filter((h) => h.status === 'failed').length,
    0,
  )

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-goblin text-2xl font-bold md:text-3xl">Dashboard</h1>
        {myStore && <span className="font-martian text-sm text-text-muted">@{myStore.handle}</span>}
      </div>

      {section === 'overview' && (
        <div className="rounded-3xl border border-border bg-gradient-to-br from-surface-light/90 to-white p-6 md:p-8">
          <p className="mb-6 font-martian text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">
            Store pulse
          </p>
          <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-border/80 bg-white/90 p-5 shadow-sm">
              <p className="font-martian text-[10px] uppercase text-text-muted">Total Listings</p>
              <p className="mt-1 font-martian text-2xl font-bold">{myListings.length}</p>
            </div>
            <div className="rounded-2xl border border-border/80 bg-white/90 p-5 shadow-sm">
              <p className="font-martian text-[10px] uppercase text-text-muted">Total Sales</p>
              <p className="mt-1 font-martian text-2xl font-bold">{soldCount}</p>
            </div>
            <div className="rounded-2xl border border-border/80 bg-white/90 p-5 shadow-sm">
              <p className="font-martian text-[10px] uppercase text-text-muted">Views</p>
              <p className="mt-1 font-martian text-2xl font-bold">{totalViews.toLocaleString()}</p>
            </div>
            <div className="rounded-2xl border border-border/80 bg-white/90 p-5 shadow-sm">
              <p className="font-martian text-[10px] uppercase text-text-muted">Saves</p>
              <p className="mt-1 font-martian text-2xl font-bold">{totalSaves.toLocaleString()}</p>
            </div>
          </div>

          <div className="mb-8 grid gap-3 md:grid-cols-2">
            <Link
              to="/dashboard/listings"
              className="rounded-2xl border border-border bg-white p-5 no-underline transition-colors hover:bg-surface-light"
            >
              <p className="font-martian text-sm font-bold text-black">Manage inventory</p>
              <p className="mt-1 font-martian text-xs text-text-muted">
                Edit statuses, select items, and cross-post listings.
              </p>
            </Link>
            <Link
              to="/dashboard/social"
              className="rounded-2xl border border-border bg-white p-5 no-underline transition-colors hover:bg-surface-light"
            >
              <p className="font-martian text-sm font-bold text-black">Social hub</p>
              <p className="mt-1 font-martian text-xs text-text-muted">
                Meta is {connected ? 'connected' : 'not connected'}
                {failedPosts > 0 ? ` · ${failedPosts} failed post${failedPosts === 1 ? '' : 's'}` : ''}
              </p>
            </Link>
          </div>

          {myStore && (
            <div className="rounded-2xl border border-black/10 bg-black/[0.03] p-6">
              <div className="flex items-center gap-4">
                {myStore.bannerUrl && (
                  <img
                    src={myStore.bannerUrl}
                    alt=""
                    className="h-20 w-32 rounded-xl object-cover shadow-md"
                  />
                )}
                <div>
                  <h2 className="font-martian text-lg font-bold">{myStore.name}</h2>
                  <p className="font-martian text-sm text-text-muted">{myStore.bio}</p>
                  <div className="mt-2 flex flex-wrap gap-3 font-martian text-xs text-text-muted">
                    <span>{myStore.followerCount} followers</span>
                    <span>⭐ {myStore.rating}</span>
                    <span>{myStore.completedTransactions} sales</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {section === 'listings' && (
        <div>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="font-martian text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">
                Inventory
              </p>
              <h2 className="font-martian text-lg font-bold text-black">Your listings</h2>
            </div>
          </div>

          {selectedIds.size > 0 && (
            <div className="mb-4 flex items-center gap-3 rounded-xl border border-brand/30 bg-brand/5 px-4 py-3">
              <span className="font-martian text-sm">{selectedIds.size} selected</span>
              <button
                onClick={handleBulkCrossPost}
                disabled={!connected}
                className="cursor-pointer rounded-full bg-brand px-4 py-2 font-martian text-xs text-white transition-colors hover:bg-black disabled:opacity-40"
                title={connected ? '' : 'Connect Meta in Settings first'}
              >
                Post {selectedIds.size} to FB/IG
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="cursor-pointer border-none bg-none font-martian text-xs text-text-muted hover:text-black"
              >
                Clear
              </button>
            </div>
          )}

          <div className="grid gap-3">
            {myListings.map((listing) => {
              const history = historyByListing[listing.id] ?? []
              const everPosted = history.some((h) => h.status === 'posted')
              const failed = history.filter((h) => h.status === 'failed')
              const latestFailure = failed[0]
              return (
                <div
                  key={listing.id}
                  className="flex items-center gap-4 border-l-4 border-brand bg-white pl-4 shadow-sm ring-1 ring-border/80 rounded-r-xl py-4 pr-4"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(listing.id)}
                    onChange={() => toggleSelect(listing.id)}
                    className="h-4 w-4 shrink-0 accent-brand"
                  />
                  <img
                    src={listing.photos[0]?.url}
                    alt=""
                    className="h-16 w-16 shrink-0 rounded-lg object-cover ring-1 ring-border"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="truncate font-martian text-sm font-semibold">{listing.title}</h3>
                    <p className="font-martian text-xs text-text-muted">
                      ₱{listing.price.toLocaleString()} · {listing.condition}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 font-martian text-[10px] text-text-muted">
                      <span>{listing.viewCount} views</span>
                      <span>·</span>
                      <span>{listing.saveCount} saves</span>
                      <span>·</span>
                      <CrossPostStatusPill history={history} />
                    </div>
                    {latestFailure && (
                      <p className="mt-1 truncate font-martian text-[10px] text-accent-red">
                        {failed.length} failed social post{failed.length === 1 ? '' : 's'}: {latestFailure.errorMessage ?? 'Check Meta connection'}
                      </p>
                    )}
                  </div>
                  <select
                    value={listing.availability}
                    onChange={(e) =>
                      handleAvailabilityChange(listing, e.target.value as ListingAvailability)
                    }
                    className={`shrink-0 cursor-pointer rounded-full px-3 py-1.5 font-martian text-xs ${listing.availability === 'available' ? 'bg-accent-green/10 text-accent-green' : listing.availability === 'reserved' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-accent-red'}`}
                  >
                    <option value="available">Available</option>
                    <option value="reserved">Reserved</option>
                    <option value="sold">Sold</option>
                  </select>
                  <button
                    onClick={() => setCrossPostListings([listing])}
                    disabled={!connected}
                    className="shrink-0 cursor-pointer rounded-full border border-border bg-white p-2 transition-colors hover:bg-surface-light disabled:opacity-40"
                    title={
                      connected
                        ? everPosted
                          ? 'Re-post to FB/IG'
                          : 'Post to FB/IG'
                        : 'Connect Meta in Settings first'
                    }
                  >
                    <Icon
                      icon={everPosted ? 'mdi:refresh' : 'mdi:share-variant-outline'}
                      width={16}
                    />
                  </button>
                </div>
              )
            })}
            {myListings.length === 0 && (
              <p className="rounded-xl border border-dashed border-border py-12 text-center font-martian text-sm text-text-muted">
                No listings yet — create your first drip.
              </p>
            )}
          </div>
        </div>
      )}

      {section === 'social' && (
        <div className="grid gap-4">
          <div className="rounded-3xl border border-border bg-white p-6 md:p-8">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-surface-light p-3">
                <Icon icon="mdi:share-variant-outline" width={28} className="text-brand" />
              </div>
              <div className="flex-1">
                <p className="font-martian text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">
                  Social hub
                </p>
                <h2 className="mt-1 font-martian text-lg font-bold">Meta posting</h2>
                <p className="mt-2 max-w-xl font-martian text-sm text-text-muted">
                  {connected
                    ? `Connected to ${meta?.pageName ?? 'your Facebook Page'}. Select items from inventory to post or repost them to Facebook and Instagram.`
                    : 'Connect your Facebook Page once in Settings before posting listings to Meta.'}
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    to="/dashboard/listings"
                    className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-2.5 font-martian text-sm text-white no-underline hover:bg-brand"
                  >
                    Select listings
                    <Icon icon="mdi:arrow-right" width={16} />
                  </Link>
                  <Link
                    to="/dashboard/settings"
                    className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 font-martian text-sm text-black no-underline hover:bg-surface-light"
                  >
                    Meta settings
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-surface-light/40 p-6">
            <h3 className="font-martian text-sm font-bold">Posting health</h3>
            <p className="mt-2 font-martian text-sm text-text-muted">
              {failedPosts > 0
                ? `${failedPosts} failed social post${failedPosts === 1 ? '' : 's'} need attention. Open Inventory to see which listings failed.`
                : 'No failed social posts found for current listings.'}
            </p>
          </div>
        </div>
      )}

      {crossPostListings && (
        <CrossPostModal
          listings={crossPostListings}
          storeHandle={myStore?.handle || ''}
          onClose={() => {
            setCrossPostListings(null)
            setSelectedIds(new Set())
          }}
          onPosted={() => {
            for (const l of crossPostListings) {
              fetchHistory(l.id)
            }
            if (crossPostListings.length > 1) {
              window.setTimeout(() => {
                for (const l of crossPostListings) {
                  fetchHistory(l.id)
                }
              }, 35_000)
            }
          }}
        />
      )}

      {soldPrompt && (
        <MarkSoldModal
          listingId={soldPrompt.id}
          listingTitle={soldPrompt.title}
          history={historyByListing[soldPrompt.id] ?? []}
          onClose={() => setSoldPrompt(null)}
          onDone={() => {
            fetchHistory(soldPrompt.id)
            setSoldPrompt(null)
          }}
        />
      )}
    </div>
  )
}
