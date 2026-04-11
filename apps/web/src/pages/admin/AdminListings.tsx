import { useEffect, useState, useCallback } from 'react'
import { Icon } from '@iconify/react'
import { axiosInstance } from '@/utils/axios.instance'
import { ADMIN_LISTINGS, ADMIN_LISTING_DELETE } from '@/utils/api.routes'

interface AdminListing {
  id: string
  title: string
  storeHandle: string
  category: string
  price: number
  status: string
  createdAt: string
}

const LIMIT = 20

export default function AdminListings() {
  const [listings, setListings] = useState<AdminListing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchListings = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) })
      if (search) params.set('search', search)
      const { data } = await axiosInstance.get(`${ADMIN_LISTINGS()}?${params}`)
      const list = data.data?.listings ?? data.data ?? []
      setListings(list)
      setHasMore(list.length === LIMIT)
    } catch {
      setError('Failed to load listings')
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    fetchListings()
  }, [fetchListings])

  async function removeListing(id: string) {
    setActionLoading(id)
    try {
      await axiosInstance.delete(ADMIN_LISTING_DELETE(id))
      setListings((prev) => prev.map((l) => (l.id === id ? { ...l, status: 'deleted' } : l)))
    } catch {
      setError('Failed to remove listing')
    } finally {
      setActionLoading(null)
    }
  }

  function statusBadge(status: string) {
    const styles: Record<string, string> = {
      available: 'bg-accent-green/10 text-accent-green',
      sold: 'bg-brand/10 text-brand',
      deleted: 'bg-accent-red/10 text-accent-red',
    }
    return styles[status] ?? 'bg-surface-light text-text-muted'
  }

  return (
    <div>
      <h1 className="mb-6 font-goblin text-2xl">Listings</h1>

      <div className="mb-4">
        <div className="relative">
          <Icon
            icon="mdi:magnify"
            width={18}
            className="absolute top-1/2 left-3 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            placeholder="Search listings…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-full rounded-lg border border-border bg-white py-2 pr-3 pl-9 font-martian text-sm outline-none focus:ring-1 focus:ring-brand"
          />
        </div>
      </div>

      {error && <p className="mb-3 font-martian text-sm text-accent-red">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-border bg-white">
        <table className="w-full min-w-[750px] text-left font-martian text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-light text-text-muted">
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Store</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-text-muted">
                  <Icon icon="mdi:loading" width={24} className="mx-auto animate-spin" />
                </td>
              </tr>
            ) : listings.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-text-muted">
                  No listings found
                </td>
              </tr>
            ) : (
              listings.map((l) => (
                <tr key={l.id} className="border-b border-border last:border-0">
                  <td className="max-w-[200px] truncate px-4 py-3">{l.title}</td>
                  <td className="px-4 py-3 text-text-secondary">@{l.storeHandle}</td>
                  <td className="px-4 py-3 text-text-muted">{l.category}</td>
                  <td className="px-4 py-3">${l.price}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge(l.status)}`}>
                      {l.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-muted">
                    {new Date(l.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => removeListing(l.id)}
                      disabled={actionLoading === l.id || l.status === 'deleted'}
                      className="rounded-lg bg-accent-red/10 px-3 py-1 text-xs font-medium text-accent-red transition-colors hover:bg-accent-red/20 disabled:opacity-40"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="rounded-lg border border-border px-4 py-2 font-martian text-sm transition-colors hover:bg-surface-light disabled:opacity-40"
        >
          Previous
        </button>
        <span className="font-martian text-sm text-text-muted">Page {page}</span>
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={!hasMore}
          className="rounded-lg border border-border px-4 py-2 font-martian text-sm transition-colors hover:bg-surface-light disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  )
}
