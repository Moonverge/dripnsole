import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { useListingStore } from '@/stores/listing.store'
import { useWishlistStore } from '@/stores/wishlist.store'
import { useMessageStore } from '@/stores/message.store'
import { useAuthStore } from '@/stores/auth.store'
import SpinViewer from '@/components/listing/SpinViewer'
import CommentsSection from '@/components/listing/CommentsSection'

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>()
  const { currentListing, fetchListingById, isLoading } = useListingStore()
  const { toggleSave, isSaved } = useWishlistStore()
  const { createOffer } = useMessageStore()
  const user = useAuthStore((s) => s.user)

  const [viewMode, setViewMode] = useState<'spin' | 'gallery'>('spin')
  const [showOffer, setShowOffer] = useState(false)
  const [offerAmount, setOfferAmount] = useState('')
  const [offerSent, setOfferSent] = useState(false)
  const [reserving, setReserving] = useState(false)
  const [reserved, setReserved] = useState(false)

  useEffect(() => {
    if (id) fetchListingById(id)
  }, [id, fetchListingById])

  if (isLoading || !currentListing) {
    return <div className="flex min-h-[50vh] items-center justify-center font-martian text-sm text-text-muted">Loading...</div>
  }

  const listing = currentListing
  const photos = listing.photos.map((p) => p.url)
  const saved = isSaved(listing.id)

  async function handleOffer() {
    if (!offerAmount) return
    await createOffer(listing.id, Number(offerAmount))
    setOfferSent(true)
  }

  async function handleReserve() {
    setReserving(true)
    await new Promise((r) => setTimeout(r, 800))
    setReserving(false)
    setReserved(true)
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="grid gap-8 md:grid-cols-2">
        <div>
          {viewMode === 'spin' ? (
            <SpinViewer photos={photos} autoPlay size="lg" />
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {photos.map((url, i) => (
                <img key={i} src={url} alt={`Photo ${i + 1}`} className="aspect-square rounded-xl object-cover" />
              ))}
            </div>
          )}
          <div className="mt-3 flex gap-2">
            <button onClick={() => setViewMode('spin')} className={`cursor-pointer rounded-full px-4 py-2 font-martian text-xs transition-colors ${viewMode === 'spin' ? 'bg-black text-white' : 'border border-border hover:bg-surface-light'}`}>
              Spin View
            </button>
            <button onClick={() => setViewMode('gallery')} className={`cursor-pointer rounded-full px-4 py-2 font-martian text-xs transition-colors ${viewMode === 'gallery' ? 'bg-black text-white' : 'border border-border hover:bg-surface-light'}`}>
              Real Photos
            </button>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className={`rounded-full px-3 py-1 font-martian text-[10px] font-bold ${listing.availability === 'available' ? 'bg-accent-green/10 text-accent-green' : listing.availability === 'reserved' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-accent-red'}`}>
              {listing.availability.charAt(0).toUpperCase() + listing.availability.slice(1)}
            </span>
            <span className="rounded-full bg-surface-light px-3 py-1 font-martian text-[10px]">{listing.condition}</span>
          </div>

          <h1 className="mb-1 font-martian text-xl font-bold md:text-2xl">{listing.title}</h1>
          <Link to={`/store/${listing.storeHandle}`} className="font-martian text-sm text-text-muted no-underline hover:text-black">
            @{listing.storeHandle}
          </Link>

          <p className="mt-4 font-martian text-3xl font-bold">
            ₱{listing.price.toLocaleString()}
            {listing.negotiable && <span className="ml-2 font-martian text-sm font-normal text-accent-green">Negotiable</span>}
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl border border-border p-4">
            <div><span className="block font-martian text-[10px] text-text-muted">Category</span><span className="font-martian text-sm">{listing.category} — {listing.subcategory}</span></div>
            <div><span className="block font-martian text-[10px] text-text-muted">Size</span><span className="font-martian text-sm">{listing.size} {listing.sizeUnit || ''}</span></div>
            {listing.measurements.chest && <div><span className="block font-martian text-[10px] text-text-muted">Chest</span><span className="font-martian text-sm">{listing.measurements.chest}cm</span></div>}
            {listing.measurements.length && <div><span className="block font-martian text-[10px] text-text-muted">Length</span><span className="font-martian text-sm">{listing.measurements.length}cm</span></div>}
            {listing.measurements.waist && <div><span className="block font-martian text-[10px] text-text-muted">Waist</span><span className="font-martian text-sm">{listing.measurements.waist}cm</span></div>}
            {listing.measurements.insoleLength && <div><span className="block font-martian text-[10px] text-text-muted">Insole</span><span className="font-martian text-sm">{listing.measurements.insoleLength}cm</span></div>}
          </div>

          {listing.description && (
            <p className="mt-4 font-martian text-sm leading-relaxed text-text-secondary">{listing.description}</p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {listing.shippingOptions.map((opt) => (
              <span key={opt} className="rounded-full border border-border px-3 py-1 font-martian text-[10px]">{opt}</span>
            ))}
          </div>

          {user && listing.availability === 'available' && (
            <div className="mt-6 flex flex-col gap-2">
              <div className="flex gap-2">
                <button onClick={() => toggleSave(listing.id)} className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-full border py-3 font-martian text-sm transition-colors ${saved ? 'border-accent-red bg-red-50 text-accent-red' : 'border-border hover:bg-surface-light'}`}>
                  <Icon icon={saved ? 'mdi:heart' : 'mdi:heart-outline'} width={18} />
                  {saved ? 'Saved' : 'Save'}
                </button>
                <Link to="/messages" className="flex flex-1 items-center justify-center gap-2 rounded-full border border-border py-3 font-martian text-sm no-underline text-black transition-colors hover:bg-surface-light">
                  <Icon icon="mdi:message-outline" width={18} /> Message
                </Link>
              </div>

              {listing.negotiable && !offerSent && (
                <button onClick={() => setShowOffer(!showOffer)} className="w-full cursor-pointer rounded-full border border-brand bg-brand/5 py-3 font-martian text-sm font-medium text-brand transition-colors hover:bg-brand hover:text-white">
                  Make an Offer
                </button>
              )}

              {showOffer && !offerSent && (
                <div className="flex gap-2 rounded-xl border border-border p-3">
                  <div className="flex flex-1 items-center rounded-lg border border-border px-3">
                    <span className="font-martian text-sm text-text-muted">₱</span>
                    <input value={offerAmount} onChange={(e) => setOfferAmount(e.target.value)} type="number" className="w-full border-none py-2 pl-1 font-martian text-sm outline-none" placeholder="Amount" />
                  </div>
                  <button onClick={handleOffer} className="cursor-pointer rounded-full bg-brand px-5 py-2 font-martian text-sm text-white transition-colors hover:bg-black">Send</button>
                </div>
              )}

              {offerSent && (
                <div className="rounded-xl border border-accent-green bg-green-50 p-3 text-center font-martian text-sm text-accent-green">
                  Offer of ₱{Number(offerAmount).toLocaleString()} sent!
                </div>
              )}

              {!reserved ? (
                <button onClick={handleReserve} disabled={reserving} className="w-full cursor-pointer rounded-full bg-black py-3 font-martian text-sm font-medium text-white transition-colors hover:bg-brand disabled:opacity-50">
                  {reserving ? 'Reserving...' : 'Reserve This Item'}
                </button>
              ) : (
                <div className="rounded-xl border border-yellow-500 bg-yellow-50 p-3 text-center font-martian text-sm text-yellow-700">Reserved — seller will confirm within 24h</div>
              )}
            </div>
          )}

          <div className="mt-4 flex gap-4 font-martian text-xs text-text-muted">
            <span>{listing.viewCount} views</span>
            <span>{listing.saveCount} saves</span>
          </div>
        </div>
      </div>

      <div className="mt-10 border-t border-border pt-8">
        <CommentsSection listingId={listing.id} />
      </div>
    </div>
  )
}
