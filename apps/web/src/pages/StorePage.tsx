import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { useStoreStore } from '@/stores/store.store'
import { useAuthStore } from '@/stores/auth.store'
import { MOCK_LISTINGS } from '@/utils/mock-data'
import ListingCard from '@/components/listing/ListingCard'
import type { ListingCondition } from '@/types/listing'

const BADGE_LABELS = { new: 'New Seller', verified: 'Verified Drip', top: 'Top Drip' }
const BADGE_COLORS = { new: 'bg-surface-light text-text-secondary', verified: 'bg-brand/10 text-brand', top: 'bg-yellow-100 text-yellow-700' }

export default function StorePage() {
  const { handle } = useParams<{ handle: string }>()
  const { viewedStore, fetchStoreByHandle, followStore, unfollowStore, isLoading } = useStoreStore()
  const user = useAuthStore((s) => s.user)
  const [following, setFollowing] = useState(false)
  const [filterCondition, setFilterCondition] = useState<ListingCondition | ''>('')

  useEffect(() => {
    if (handle) fetchStoreByHandle(handle)
  }, [handle, fetchStoreByHandle])

  if (isLoading || !viewedStore) {
    return <div className="flex min-h-[50vh] items-center justify-center font-martian text-sm text-text-muted">Loading store...</div>
  }

  const storeListings = MOCK_LISTINGS
    .filter((l) => l.storeId === viewedStore.id)
    .filter((l) => !filterCondition || l.condition === filterCondition)

  async function handleFollow() {
    if (following) {
      await unfollowStore(viewedStore!.id)
    } else {
      await followStore(viewedStore!.id)
    }
    setFollowing(!following)
  }

  return (
    <div>
      <div className="relative h-48 overflow-hidden bg-surface-light md:h-64">
        {viewedStore.bannerUrl && (
          <img src={viewedStore.bannerUrl} alt="" className="h-full w-full object-cover" />
        )}
      </div>

      <div className="mx-auto max-w-[1280px] px-4">
        <div className="flex flex-col gap-4 py-6 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-3">
              <h1 className="font-martian text-xl font-bold md:text-2xl">{viewedStore.name}</h1>
              <span className={`rounded-full px-3 py-1 font-martian text-[10px] font-bold ${BADGE_COLORS[viewedStore.badge]}`}>
                {BADGE_LABELS[viewedStore.badge]}
              </span>
            </div>
            <p className="font-martian text-sm text-text-muted">@{viewedStore.handle}</p>
            <p className="mt-2 max-w-lg font-martian text-sm text-text-secondary">{viewedStore.bio}</p>

            <div className="mt-3 flex flex-wrap gap-2">
              {viewedStore.categories.map((cat) => (
                <span key={cat} className="rounded-full bg-surface-light px-3 py-1 font-martian text-[10px]">{cat}</span>
              ))}
            </div>

            <div className="mt-3 flex gap-4 font-martian text-xs text-text-muted">
              <span>⭐ {viewedStore.rating} ({viewedStore.reviewCount})</span>
              <span>{viewedStore.completedTransactions} sales</span>
              <span>{viewedStore.followerCount} followers</span>
            </div>

            <div className="mt-2 flex gap-4 font-martian text-xs text-text-muted">
              <span>📍 {viewedStore.pickupInfo}</span>
              <span>📦 {viewedStore.shippingInfo}</span>
            </div>
          </div>

          {user && (
            <div className="flex gap-2">
              <button
                onClick={handleFollow}
                className={`cursor-pointer rounded-full px-6 py-2.5 font-martian text-sm transition-colors ${following ? 'border border-border bg-white hover:bg-surface-light' : 'bg-black text-white hover:bg-brand'}`}
              >
                {following ? 'Following' : 'Follow'}
              </button>
              <button className="cursor-pointer rounded-full border border-border px-4 py-2.5 transition-colors hover:bg-surface-light">
                <Icon icon="mdi:share-variant-outline" width={18} />
              </button>
            </div>
          )}
        </div>

        <div className="border-t border-border py-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-martian text-base font-bold">Listings ({storeListings.length})</h2>
            <select
              value={filterCondition}
              onChange={(e) => setFilterCondition(e.target.value as ListingCondition | '')}
              className="cursor-pointer rounded-lg border border-border px-3 py-2 font-martian text-xs focus:outline-none"
            >
              <option value="">All Conditions</option>
              <option value="BNWT">BNWT</option>
              <option value="VNDS">VNDS</option>
              <option value="9/10">9/10</option>
              <option value="8/10">8/10</option>
              <option value="Thrifted">Thrifted</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {storeListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} showStore={false} />
            ))}
          </div>

          {storeListings.length === 0 && (
            <p className="py-12 text-center font-martian text-sm text-text-muted">No listings yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}
