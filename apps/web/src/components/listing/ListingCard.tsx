import { Link } from 'react-router-dom'
import { Icon } from '@iconify/react'
import type { Listing } from '@/types/listing'
import { useWishlistStore } from '@/stores/wishlist.store'
import SpinViewer from './SpinViewer'

interface ListingCardProps {
  listing: Listing
  showStore?: boolean
}

export default function ListingCard({ listing, showStore = true }: ListingCardProps) {
  const { toggleSave, isSaved } = useWishlistStore()
  const saved = isSaved(listing.id)
  const photos = listing.photos.map((p) => p.url)

  const availabilityBadge = {
    available: null,
    reserved: { label: 'Reserved', className: 'bg-yellow-500 text-white' },
    sold: { label: 'Sold', className: 'bg-accent-red text-white' },
  }[listing.availability]

  return (
    <div className="group relative">
      <Link to={`/listing/${listing.id}`} className="block no-underline text-black">
        <div className="relative">
          <SpinViewer photos={photos} autoPlay size="sm" />
          {availabilityBadge && (
            <span className={`absolute left-3 top-3 rounded-full px-3 py-1 font-martian text-[10px] font-bold ${availabilityBadge.className}`}>
              {availabilityBadge.label}
            </span>
          )}
        </div>
        <div className="mt-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-martian text-sm leading-tight">{listing.title}</h3>
          </div>
          {showStore && (
            <p className="mt-0.5 font-martian text-xs text-text-muted">@{listing.storeHandle}</p>
          )}
          <div className="mt-1.5 flex items-center justify-between">
            <span className="font-martian text-base font-bold">₱{listing.price.toLocaleString()}</span>
            <span className="rounded-full bg-surface-light px-2.5 py-0.5 font-martian text-[10px]">{listing.condition}</span>
          </div>
        </div>
      </Link>
      <button
        onClick={(e) => { e.preventDefault(); toggleSave(listing.id) }}
        className="absolute right-2 top-2 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/80 backdrop-blur-sm transition-colors hover:bg-white"
      >
        <Icon icon={saved ? 'mdi:heart' : 'mdi:heart-outline'} width={18} className={saved ? 'text-accent-red' : 'text-text-muted'} />
      </button>
    </div>
  )
}
