import { useEffect, useState, useCallback } from 'react'
import { Icon } from '@iconify/react'
import { axiosInstance } from '@/utils/axios.instance'
import { ADMIN_REPORTS, ADMIN_REPORT_UPDATE } from '@/utils/api.routes'

interface AdminReport {
  id: string
  targetType: string
  targetId: string
  reason: string
  status: string
  createdAt: string
}

const STATUSES = ['all', 'pending', 'resolved', 'dismissed'] as const
const LIMIT = 20

export default function AdminReports() {
  const [reports, setReports] = useState<AdminReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchReports = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) })
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const { data } = await axiosInstance.get(`${ADMIN_REPORTS()}?${params}`)
      const list = data.data?.reports ?? data.data ?? []
      setReports(list)
      setHasMore(list.length === LIMIT)
    } catch {
      setError('Failed to load reports')
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  async function updateStatus(reportId: string, status: string) {
    setActionLoading(reportId)
    try {
      await axiosInstance.patch(ADMIN_REPORT_UPDATE(reportId), { status })
      setReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, status } : r)))
    } catch {
      setError('Failed to update report')
    } finally {
      setActionLoading(null)
    }
  }

  function statusBadge(status: string) {
    const styles: Record<string, string> = {
      pending: 'bg-brand/10 text-brand',
      resolved: 'bg-accent-green/10 text-accent-green',
      dismissed: 'bg-surface-light text-text-muted',
    }
    return styles[status] ?? 'bg-surface-light text-text-muted'
  }

  return (
    <div>
      <h1 className="mb-6 font-goblin text-2xl">Reports</h1>

      <div className="mb-4">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value)
            setPage(1)
          }}
          className="rounded-lg border border-border bg-white px-3 py-2 font-martian text-sm outline-none"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="mb-3 font-martian text-sm text-accent-red">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-border bg-white">
        <table className="w-full min-w-[700px] text-left font-martian text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-light text-text-muted">
              <th className="px-4 py-3 font-medium">Target Type</th>
              <th className="px-4 py-3 font-medium">Target ID</th>
              <th className="px-4 py-3 font-medium">Reason</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Date</th>
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
            ) : reports.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-text-muted">
                  No reports found
                </td>
              </tr>
            ) : (
              reports.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 capitalize">{r.targetType}</td>
                  <td className="px-4 py-3 font-mono text-xs text-text-muted">
                    {r.targetId.slice(0, 8)}…
                  </td>
                  <td className="max-w-[200px] truncate px-4 py-3">{r.reason}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge(r.status)}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-muted">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </td>
                  <td className="flex gap-2 px-4 py-3">
                    {r.status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateStatus(r.id, 'resolved')}
                          disabled={actionLoading === r.id}
                          className="rounded-lg bg-accent-green/10 px-3 py-1 text-xs font-medium text-accent-green transition-colors hover:bg-accent-green/20 disabled:opacity-50"
                        >
                          Resolve
                        </button>
                        <button
                          onClick={() => updateStatus(r.id, 'dismissed')}
                          disabled={actionLoading === r.id}
                          className="rounded-lg bg-surface-light px-3 py-1 text-xs font-medium text-text-muted transition-colors hover:bg-border disabled:opacity-50"
                        >
                          Dismiss
                        </button>
                      </>
                    )}
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
