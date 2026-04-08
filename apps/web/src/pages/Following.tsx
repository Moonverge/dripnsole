import { useEffect } from 'react'
import { Icon } from '@iconify/react'
import { useListingStore } from '@/stores/listing.store'
import ListingCard from '@/components/listing/ListingCard'

export default function Following() {
  const { followingListings, fetchFollowingFeed, isLoading } = useListingStore()

  useEffect(() => {
    fetchFollowingFeed()
  }, [fetchFollowingFeed])

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-6">
      <h1 className="mb-6 font-goblin text-2xl font-bold md:text-3xl">Following</h1>

      {isLoading ? (
        <div className="flex min-h-[40vh] items-center justify-center font-martian text-sm text-text-muted">
          Loading...
        </div>
      ) : followingListings.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center">
          <Icon icon="mdi:store-outline" width={48} className="mb-3 text-text-muted" />
          <p className="font-martian text-sm text-text-muted">
            No new drops from stores you follow
          </p>
          <p className="mt-1 font-martian text-xs text-text-faint">
            Follow stores to see their latest listings here
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {followingListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  )
}
