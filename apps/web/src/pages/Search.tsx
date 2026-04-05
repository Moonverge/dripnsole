import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { useListingStore } from '@/stores/listing.store'
import ListingCard from '@/components/listing/ListingCard'

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const [query, setQuery] = useState(initialQuery)
  const { listings, searchListings, isLoading } = useListingStore()

  useEffect(() => {
    if (initialQuery) searchListings(initialQuery)
  }, [initialQuery, searchListings])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) {
      setSearchParams({ q: query.trim() })
      searchListings(query.trim())
    }
  }

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-6">
      <form onSubmit={handleSearch} className="mb-8">
        <div className="relative">
          <Icon icon="ph:magnifying-glass" width={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search drips, stores, tags..."
            className="w-full rounded-2xl border border-border py-4 pl-12 pr-4 font-martian text-sm focus:border-brand focus:outline-none"
            autoFocus
          />
        </div>
      </form>

      {initialQuery && (
        <p className="mb-4 font-martian text-sm text-text-muted">
          {isLoading ? 'Searching...' : `${listings.length} results for "${initialQuery}"`}
        </p>
      )}

      {!initialQuery && !isLoading && (
        <div className="flex min-h-[40vh] flex-col items-center justify-center">
          <Icon icon="ph:magnifying-glass" width={48} className="mb-3 text-text-muted" />
          <p className="font-martian text-sm text-text-muted">Search across listings, store names, and tags</p>
        </div>
      )}

      {listings.length > 0 && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}

      {initialQuery && !isLoading && listings.length === 0 && (
        <div className="flex min-h-[30vh] flex-col items-center justify-center">
          <p className="font-martian text-sm text-text-muted">No results for "{initialQuery}"</p>
          <p className="mt-1 font-martian text-xs text-text-faint">Try different keywords or browse categories</p>
        </div>
      )}
    </div>
  )
}
