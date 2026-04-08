import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useListingStore } from '@/stores/listing.store'
import PhotoUpload from '@/components/listing/PhotoUpload'
import SpinViewer from '@/components/listing/SpinViewer'
import CrossPostModal from '@/components/listing/CrossPostModal'
import type {
  PhotoSlot,
  ListingCategory,
  ClothesSubcategory,
  ShoesSubcategory,
  ListingCondition,
  Measurements,
} from '@/types/listing'

const CONDITIONS: ListingCondition[] = ['BNWT', 'BNWOT', 'VNDS', '9/10', '8/10', '7/10', 'Thrifted']
const CLOTHES_SUBCATS: ClothesSubcategory[] = [
  'Tops',
  'Bottoms',
  'Dresses',
  'Outerwear',
  'Accessories',
]
const SHOES_SUBCATS: ShoesSubcategory[] = ['Sneakers', 'Heels', 'Flats', 'Boots', 'Sandals']
const SHIPPING_OPTIONS = ['J&T Express', 'LBC', 'Lalamove', 'Meetup / COD']

export default function CreateListing() {
  const navigate = useNavigate()
  const { createListing, isLoading } = useListingStore()
  const [photos, setPhotos] = useState<Map<PhotoSlot, File>>(new Map())
  const [showPreview, setShowPreview] = useState(false)
  const [showCrossPost, setShowCrossPost] = useState(false)
  const [createdListing, setCreatedListing] =
    useState<ReturnType<typeof useListingStore.getState>['currentListing']>(null)

  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<ListingCategory>('Clothes')
  const [subcategory, setSubcategory] = useState('')
  const [condition, setCondition] = useState<ListingCondition>('VNDS')
  const [size, setSize] = useState('')
  const [sizeUnit, setSizeUnit] = useState<'EU' | 'US' | 'UK'>('US')
  const [measurements, setMeasurements] = useState<Measurements>({})
  const [price, setPrice] = useState('')
  const [negotiable, setNegotiable] = useState(false)
  const [shipping, setShipping] = useState<string[]>([])
  const [description, setDescription] = useState('')

  const photoFiles = Array.from(photos.values())
  const previewUrls = photoFiles.map((f) => URL.createObjectURL(f))

  function toggleShipping(opt: string) {
    setShipping((prev) => (prev.includes(opt) ? prev.filter((s) => s !== opt) : [...prev, opt]))
  }

  async function handlePublish() {
    const listing = await createListing({
      title,
      category,
      subcategory: subcategory as ClothesSubcategory | ShoesSubcategory,
      condition,
      size,
      sizeUnit: category === 'Shoes' ? sizeUnit : undefined,
      measurements,
      price: Number(price),
      negotiable,
      shippingOptions: shipping,
      description,
      photos: photoFiles,
    })
    setCreatedListing(listing)
    setShowCrossPost(true)
  }

  if (showPreview) {
    return (
      <div className="mx-auto max-w-lg px-4 py-6">
        <h1 className="mb-4 font-goblin text-2xl font-bold">Spin Preview</h1>
        <p className="mb-4 font-martian text-sm text-text-muted">
          This is how buyers will see your drip. Drag to spin.
        </p>
        <div className="mb-6 flex justify-center">
          <SpinViewer photos={previewUrls} size="lg" />
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowPreview(false)}
            className="flex-1 cursor-pointer rounded-full border border-border bg-white py-3 font-martian text-sm transition-colors hover:bg-surface-light"
          >
            Back to Edit
          </button>
          <button
            onClick={handlePublish}
            disabled={isLoading}
            className="flex-1 cursor-pointer rounded-full bg-brand py-3 font-martian text-sm font-medium text-white transition-colors hover:bg-black disabled:opacity-50"
          >
            {isLoading ? 'Publishing...' : 'Publish Drip'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="mb-6 font-goblin text-2xl font-bold md:text-3xl">New Listing</h1>

        <section className="mb-8">
          <h2 className="mb-3 font-martian text-sm font-bold">Photos</h2>
          <PhotoUpload photos={photos} onChange={setPhotos} />
        </section>

        <section className="mb-6 grid gap-4">
          <div>
            <label className="mb-1.5 block font-martian text-xs font-medium text-text-secondary">
              Title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-border px-4 py-3 font-martian text-sm focus:border-brand focus:outline-none"
              placeholder="e.g. Vintage Nike Air Max 97"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block font-martian text-xs font-medium text-text-secondary">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value as ListingCategory)
                  setSubcategory('')
                }}
                className="w-full rounded-lg border border-border px-4 py-3 font-martian text-sm focus:border-brand focus:outline-none"
              >
                <option value="Clothes">Clothes</option>
                <option value="Shoes">Shoes</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block font-martian text-xs font-medium text-text-secondary">
                Subcategory
              </label>
              <select
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                className="w-full rounded-lg border border-border px-4 py-3 font-martian text-sm focus:border-brand focus:outline-none"
              >
                <option value="">Select...</option>
                {(category === 'Clothes' ? CLOTHES_SUBCATS : SHOES_SUBCATS).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block font-martian text-xs font-medium text-text-secondary">
              Condition
            </label>
            <div className="flex flex-wrap gap-2">
              {CONDITIONS.map((c) => (
                <button
                  key={c}
                  onClick={() => setCondition(c)}
                  className={`cursor-pointer rounded-full px-4 py-2 font-martian text-xs transition-colors ${condition === c ? 'bg-black text-white' : 'border border-border hover:bg-surface-light'}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block font-martian text-xs font-medium text-text-secondary">
                Size
              </label>
              <input
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="w-full rounded-lg border border-border px-4 py-3 font-martian text-sm focus:border-brand focus:outline-none"
                placeholder={category === 'Shoes' ? '10' : 'M'}
              />
            </div>
            {category === 'Shoes' && (
              <div>
                <label className="mb-1.5 block font-martian text-xs font-medium text-text-secondary">
                  Size Unit
                </label>
                <select
                  value={sizeUnit}
                  onChange={(e) => setSizeUnit(e.target.value as 'EU' | 'US' | 'UK')}
                  className="w-full rounded-lg border border-border px-4 py-3 font-martian text-sm focus:border-brand focus:outline-none"
                >
                  <option value="US">US</option>
                  <option value="EU">EU</option>
                  <option value="UK">UK</option>
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="mb-1.5 block font-martian text-xs font-medium text-text-secondary">
              Measurements (cm)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {category === 'Clothes' ? (
                <>
                  <input
                    placeholder="Chest"
                    type="number"
                    onChange={(e) =>
                      setMeasurements((m) => ({ ...m, chest: Number(e.target.value) }))
                    }
                    className="rounded-lg border border-border px-3 py-2.5 font-martian text-xs focus:border-brand focus:outline-none"
                  />
                  <input
                    placeholder="Length"
                    type="number"
                    onChange={(e) =>
                      setMeasurements((m) => ({ ...m, length: Number(e.target.value) }))
                    }
                    className="rounded-lg border border-border px-3 py-2.5 font-martian text-xs focus:border-brand focus:outline-none"
                  />
                  <input
                    placeholder="Waist"
                    type="number"
                    onChange={(e) =>
                      setMeasurements((m) => ({ ...m, waist: Number(e.target.value) }))
                    }
                    className="rounded-lg border border-border px-3 py-2.5 font-martian text-xs focus:border-brand focus:outline-none"
                  />
                </>
              ) : (
                <input
                  placeholder="Insole Length"
                  type="number"
                  onChange={(e) =>
                    setMeasurements((m) => ({ ...m, insoleLength: Number(e.target.value) }))
                  }
                  className="col-span-3 rounded-lg border border-border px-3 py-2.5 font-martian text-xs focus:border-brand focus:outline-none"
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block font-martian text-xs font-medium text-text-secondary">
                Price (₱)
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full rounded-lg border border-border px-4 py-3 font-martian text-sm focus:border-brand focus:outline-none"
                placeholder="0"
              />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={negotiable}
                  onChange={(e) => setNegotiable(e.target.checked)}
                  className="h-4 w-4 accent-brand"
                />
                <span className="font-martian text-sm">Negotiable</span>
              </label>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block font-martian text-xs font-medium text-text-secondary">
              Shipping Options
            </label>
            <div className="flex flex-wrap gap-2">
              {SHIPPING_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => toggleShipping(opt)}
                  className={`cursor-pointer rounded-full px-4 py-2 font-martian text-xs transition-colors ${shipping.includes(opt) ? 'bg-black text-white' : 'border border-border hover:bg-surface-light'}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block font-martian text-xs font-medium text-text-secondary">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full resize-none rounded-lg border border-border px-4 py-3 font-martian text-sm focus:border-brand focus:outline-none"
              placeholder="Describe your drip..."
            />
          </div>
        </section>

        <button
          onClick={() => setShowPreview(true)}
          disabled={photos.size < 3 || !title || !price}
          className="w-full cursor-pointer rounded-full bg-brand py-3.5 font-martian text-sm font-medium text-white transition-colors hover:bg-black disabled:opacity-40"
        >
          Preview Spin & Publish
        </button>
      </div>

      {showCrossPost && createdListing && (
        <CrossPostModal
          listings={[createdListing]}
          storeHandle="ThriftByKath"
          onClose={() => {
            setShowCrossPost(false)
            navigate('/dashboard/listings')
          }}
          onPost={async () => {
            await new Promise((r) => setTimeout(r, 1500))
          }}
        />
      )}
    </>
  )
}
