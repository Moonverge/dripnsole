import { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import { useListingStore } from '@/stores/listing.store'
import ListingCard from '@/components/listing/ListingCard'
import type { ListingCategory, ListingCondition, ListingSortOption } from '@/types/listing'

export default function Explore() {
  const { listings, fetchListings, isLoading } = useListingStore()
  const [showFilters, setShowFilters] = useState(false)
  const [category, setCategory] = useState<ListingCategory | ''>('')
  const [condition, setCondition] = useState<ListingCondition | ''>('')
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [sort, setSort] = useState<ListingSortOption>('newest')

  useEffect(() => {
    fetchListings({
      category: category || undefined,
      condition: condition || undefined,
      priceMin: priceMin ? Number(priceMin) : undefined,
      priceMax: priceMax ? Number(priceMax) : undefined,
      sort,
    })
  }, [category, condition, priceMin, priceMax, sort, fetchListings])

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-goblin text-2xl font-bold md:text-3xl">Explore</h1>
        <div className="flex items-center gap-3">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as ListingSortOption)}
            className="cursor-pointer rounded-lg border border-border px-3 py-2 font-martian text-xs focus:outline-none"
          >
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low–High</option>
            <option value="price_desc">Price: High–Low</option>
            <option value="most_saved">Most Saved</option>
          </select>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex cursor-pointer items-center gap-1 rounded-lg border border-border px-3 py-2 font-martian text-xs transition-colors hover:bg-surface-light md:hidden"
          >
            <Icon icon="mdi:filter-variant" width={16} /> Filters
          </button>
        </div>
      </div>

      <div className="flex gap-8">
        <aside className={`${showFilters ? 'fixed inset-0 z-50 block bg-white p-6 md:static md:z-auto md:p-0' : 'hidden'} w-full shrink-0 md:block md:w-48`}>
          {showFilters && (
            <button onClick={() => setShowFilters(false)} className="mb-4 cursor-pointer border-none bg-none font-martian text-sm text-text-muted md:hidden">
              ✕ Close Filters
            </button>
          )}

          <div className="mb-6">
            <h3 className="mb-2 font-martian text-xs font-bold uppercase text-text-muted">Category</h3>
            <div className="flex flex-col gap-1">
              <button onClick={() => setCategory('')} className={`cursor-pointer rounded px-3 py-1.5 text-left font-martian text-sm ${!category ? 'bg-black text-white' : 'hover:bg-surface-light'}`}>All</button>
              <button onClick={() => setCategory('Clothes')} className={`cursor-pointer rounded px-3 py-1.5 text-left font-martian text-sm ${category === 'Clothes' ? 'bg-black text-white' : 'hover:bg-surface-light'}`}>Clothes</button>
              <button onClick={() => setCategory('Shoes')} className={`cursor-pointer rounded px-3 py-1.5 text-left font-martian text-sm ${category === 'Shoes' ? 'bg-black text-white' : 'hover:bg-surface-light'}`}>Shoes</button>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="mb-2 font-martian text-xs font-bold uppercase text-text-muted">Condition</h3>
            <div className="flex flex-col gap-1">
              <button onClick={() => setCondition('')} className={`cursor-pointer rounded px-3 py-1.5 text-left font-martian text-sm ${!condition ? 'bg-black text-white' : 'hover:bg-surface-light'}`}>All</button>
              {(['BNWT', 'VNDS', '9/10', '8/10', 'Thrifted'] as const).map((c) => (
                <button key={c} onClick={() => setCondition(c)} className={`cursor-pointer rounded px-3 py-1.5 text-left font-martian text-sm ${condition === c ? 'bg-black text-white' : 'hover:bg-surface-light'}`}>{c}</button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="mb-2 font-martian text-xs font-bold uppercase text-text-muted">Price (₱)</h3>
            <div className="flex gap-2">
              <input value={priceMin} onChange={(e) => setPriceMin(e.target.value)} placeholder="Min" type="number" className="w-full rounded-lg border border-border px-3 py-2 font-martian text-xs focus:outline-none" />
              <input value={priceMax} onChange={(e) => setPriceMax(e.target.value)} placeholder="Max" type="number" className="w-full rounded-lg border border-border px-3 py-2 font-martian text-xs focus:outline-none" />
            </div>
          </div>
        </aside>

        <div className="flex-1">
          {isLoading ? (
            <div className="flex min-h-[40vh] items-center justify-center font-martian text-sm text-text-muted">Loading...</div>
          ) : listings.length === 0 ? (
            <div className="flex min-h-[40vh] items-center justify-center font-martian text-sm text-text-muted">No drips found matching your filters.</div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
