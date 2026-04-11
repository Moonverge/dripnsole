import { useEffect, useState, useCallback } from 'react'
import { Icon } from '@iconify/react'
import { axiosInstance } from '@/utils/axios.instance'
import { ADMIN_STORES, ADMIN_STORE_BADGE, ADMIN_STORE_SUSPEND } from '@/utils/api.routes'

interface AdminStore {
  id: string
  name: string
  handle: string
  badge: string | null
  totalListings: number | null
  createdAt: string
  suspended: boolean
}

const BADGES = ['new', 'verified', 'top'] as const
const LIMIT = 20

export default function AdminStores() {
  const [stores, setStores] = useState<AdminStore[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchStores = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) })
      if (search) params.set('search', search)
      const { data } = await axiosInstance.get(`${ADMIN_STORES()}?${params}`)
      const list = data.data?.stores ?? data.data ?? []
      setStores(list)
      setHasMore(list.length === LIMIT)
    } catch {
      setError('Failed to load stores')
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    fetchStores()
  }, [fetchStores])

  async function setBadge(storeId: string, badge: string) {
    setActionLoading(storeId)
    try {
      await axiosInstance.patch(ADMIN_STORE_BADGE(storeId), { badge })
      setStores((prev) => prev.map((s) => (s.id === storeId ? { ...s, badge } : s)))
    } catch {
      setError('Failed to update badge')
    } finally {
      setActionLoading(null)
    }
  }

  async function suspendStore(storeId: string) {
    setActionLoading(storeId)
    try {
      await axiosInstance.patch(ADMIN_STORE_SUSPEND(storeId))
      setStores((prev) =>
        prev.map((s) => (s.id === storeId ? { ...s, suspended: !s.suspended } : s)),
      )
    } catch {
      setError('Failed to update store suspension')
    } finally {
      setActionLoading(null)
    }
  }

  function badgeColor(badge: string | null) {
    if (badge === 'verified') return 'bg-accent-green/10 text-accent-green'
    if (badge === 'top') return 'bg-brand/10 text-brand'
    return 'bg-surface-light text-text-muted'
  }

  return (
    <div>
      <h1 className="mb-6 font-goblin text-2xl">Stores</h1>

      <div className="mb-4">
        <div className="relative">
          <Icon
            icon="mdi:magnify"
            width={18}
            className="absolute top-1/2 left-3 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            placeholder="Search stores…"
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
        <table className="w-full min-w-[700px] text-left font-martian text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-light text-text-muted">
              <th className="px-4 py-3 font-medium">Store Name</th>
              <th className="px-4 py-3 font-medium">Handle</th>
              <th className="px-4 py-3 font-medium">Badge</th>
              <th className="px-4 py-3 font-medium">Total Listings</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-text-muted">
                  <Icon icon="mdi:loading" width={24} className="mx-auto animate-spin" />
                </td>
              </tr>
            ) : stores.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-text-muted">
                  No stores found
                </td>
              </tr>
            ) : (
              stores.map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">{s.name}</td>
                  <td className="px-4 py-3 text-text-secondary">@{s.handle}</td>
                  <td className="px-4 py-3">
                    <select
                      value={s.badge ?? 'new'}
                      onChange={(e) => setBadge(s.id, e.target.value)}
                      disabled={actionLoading === s.id}
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeColor(s.badge)} border-none outline-none`}
                    >
                      {BADGES.map((b) => (
                        <option key={b} value={b}>
                          {b.charAt(0).toUpperCase() + b.slice(1)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-text-muted">
                    {s.totalListings != null ? s.totalListings : '-'}
                  </td>
                  <td className="px-4 py-3 text-text-muted">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => suspendStore(s.id)}
                      disabled={actionLoading === s.id}
                      className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                        s.suspended
                          ? 'bg-accent-green/10 text-accent-green hover:bg-accent-green/20'
                          : 'bg-accent-red/10 text-accent-red hover:bg-accent-red/20'
                      } disabled:opacity-50`}
                    >
                      {s.suspended ? 'Unsuspend' : 'Suspend'}
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
