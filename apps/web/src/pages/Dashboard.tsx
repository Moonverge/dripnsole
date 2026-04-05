import { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import { useListingStore } from '@/stores/listing.store'
import { useStoreStore } from '@/stores/store.store'
import type { ListingAvailability } from '@/types/listing'
import CrossPostModal from '@/components/listing/CrossPostModal'
import type { Listing } from '@/types/listing'

export default function Dashboard() {
  const { myListings, fetchMyListings, updateAvailability } = useListingStore()
  const { myStore, fetchMyStore } = useStoreStore()
  const [tab, setTab] = useState<'overview' | 'listings' | 'social'>('overview')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [crossPostListings, setCrossPostListings] = useState<Listing[] | null>(null)

  useEffect(() => {
    fetchMyListings()
    fetchMyStore()
  }, [fetchMyListings, fetchMyStore])

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
    if (selected.length > 0) setCrossPostListings(selected)
  }

  const totalViews = myListings.reduce((s, l) => s + l.viewCount, 0)
  const totalSaves = myListings.reduce((s, l) => s + l.saveCount, 0)
  const soldCount = myListings.filter((l) => l.availability === 'sold').length

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-goblin text-2xl font-bold md:text-3xl">Dashboard</h1>
        {myStore && (
          <span className="font-martian text-sm text-text-muted">@{myStore.handle}</span>
        )}
      </div>

      <div className="mb-6 flex gap-2 border-b border-border">
        {(['overview', 'listings', 'social'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`cursor-pointer border-b-2 px-4 py-3 font-martian text-sm capitalize transition-colors ${tab === t ? 'border-black font-bold text-black' : 'border-transparent text-text-muted hover:text-black'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div>
          <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-border p-5">
              <p className="font-martian text-[10px] uppercase text-text-muted">Total Listings</p>
              <p className="mt-1 font-martian text-2xl font-bold">{myListings.length}</p>
            </div>
            <div className="rounded-2xl border border-border p-5">
              <p className="font-martian text-[10px] uppercase text-text-muted">Total Sales</p>
              <p className="mt-1 font-martian text-2xl font-bold">{soldCount}</p>
            </div>
            <div className="rounded-2xl border border-border p-5">
              <p className="font-martian text-[10px] uppercase text-text-muted">Views This Week</p>
              <p className="mt-1 font-martian text-2xl font-bold">{totalViews.toLocaleString()}</p>
            </div>
            <div className="rounded-2xl border border-border p-5">
              <p className="font-martian text-[10px] uppercase text-text-muted">Total Saves</p>
              <p className="mt-1 font-martian text-2xl font-bold">{totalSaves}</p>
            </div>
          </div>

          {myStore && (
            <div className="rounded-2xl border border-border p-6">
              <div className="flex items-center gap-4">
                {myStore.bannerUrl && <img src={myStore.bannerUrl} alt="" className="h-16 w-24 rounded-lg object-cover" />}
                <div>
                  <h2 className="font-martian text-base font-bold">{myStore.name}</h2>
                  <p className="font-martian text-sm text-text-muted">{myStore.bio}</p>
                  <div className="mt-1 flex gap-3 font-martian text-xs text-text-muted">
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

      {tab === 'listings' && (
        <div>
          {selectedIds.size > 0 && (
            <div className="mb-4 flex items-center gap-3 rounded-xl bg-surface-light px-4 py-3">
              <span className="font-martian text-sm">{selectedIds.size} selected</span>
              <button onClick={handleBulkCrossPost} className="cursor-pointer rounded-full bg-brand px-4 py-2 font-martian text-xs text-white transition-colors hover:bg-black">
                Post to FB/IG
              </button>
              <button onClick={() => setSelectedIds(new Set())} className="cursor-pointer border-none bg-none font-martian text-xs text-text-muted hover:text-black">Clear</button>
            </div>
          )}

          <div className="grid gap-4">
            {myListings.map((listing) => (
              <div key={listing.id} className="flex items-center gap-4 rounded-xl border border-border p-4 transition-colors hover:bg-surface-light/50">
                <input
                  type="checkbox"
                  checked={selectedIds.has(listing.id)}
                  onChange={() => toggleSelect(listing.id)}
                  className="h-4 w-4 shrink-0 accent-brand"
                />
                <img src={listing.photos[0]?.url} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <h3 className="truncate font-martian text-sm font-medium">{listing.title}</h3>
                  <p className="font-martian text-xs text-text-muted">₱{listing.price.toLocaleString()} · {listing.condition}</p>
                  <div className="mt-1 flex gap-3 font-martian text-[10px] text-text-muted">
                    <span>{listing.viewCount} views</span>
                    <span>{listing.saveCount} saves</span>
                  </div>
                </div>
                <select
                  value={listing.availability}
                  onChange={(e) => updateAvailability(listing.id, e.target.value as ListingAvailability)}
                  className={`shrink-0 cursor-pointer rounded-full px-3 py-1.5 font-martian text-xs ${listing.availability === 'available' ? 'bg-accent-green/10 text-accent-green' : listing.availability === 'reserved' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-accent-red'}`}
                >
                  <option value="available">Available</option>
                  <option value="reserved">Reserved</option>
                  <option value="sold">Sold</option>
                </select>
                <button
                  onClick={() => setCrossPostListings([listing])}
                  className="shrink-0 cursor-pointer rounded-full border border-border p-2 transition-colors hover:bg-surface-light"
                  title="Post to social"
                >
                  <Icon icon="mdi:share-variant-outline" width={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'social' && (
        <div className="rounded-2xl border border-border p-8 text-center">
          <Icon icon="mdi:share-variant-outline" width={48} className="mx-auto mb-3 text-text-muted" />
          <h2 className="mb-2 font-martian text-base font-bold">Cross-Post to Social</h2>
          <p className="mb-4 font-martian text-sm text-text-muted">Select listings from the Listings tab to post to Facebook and Instagram.</p>
          <button onClick={() => setTab('listings')} className="cursor-pointer rounded-full bg-brand px-6 py-3 font-martian text-sm text-white transition-colors hover:bg-black">
            Go to Listings
          </button>
        </div>
      )}

      {crossPostListings && (
        <CrossPostModal
          listings={crossPostListings}
          storeHandle={myStore?.handle || ''}
          onClose={() => { setCrossPostListings(null); setSelectedIds(new Set()) }}
          onPost={async () => { await new Promise((r) => setTimeout(r, 1500)) }}
        />
      )}
    </div>
  )
}
