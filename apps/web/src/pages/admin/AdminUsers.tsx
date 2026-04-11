import { useEffect, useState, useCallback } from 'react'
import { Icon } from '@iconify/react'
import { axiosInstance } from '@/utils/axios.instance'
import {
  ADMIN_USERS,
  ADMIN_USER_ROLE,
  ADMIN_USER_SUSPEND,
  ADMIN_USER_UNSUSPEND,
} from '@/utils/api.routes'

interface AdminUser {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
  suspended: boolean
}

const ROLES = ['all', 'buyer', 'seller', 'admin'] as const
const LIMIT = 20

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) })
      if (search) params.set('search', search)
      if (roleFilter !== 'all') params.set('role', roleFilter)
      const { data } = await axiosInstance.get(`${ADMIN_USERS()}?${params}`)
      const list = data.data?.users ?? data.data ?? []
      setUsers(list)
      setHasMore(list.length === LIMIT)
    } catch {
      setError('Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [page, search, roleFilter])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  async function changeRole(userId: string, newRole: string) {
    setActionLoading(userId)
    try {
      await axiosInstance.patch(ADMIN_USER_ROLE(userId), { role: newRole })
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)))
    } catch {
      setError('Failed to change role')
    } finally {
      setActionLoading(null)
    }
  }

  async function toggleSuspend(user: AdminUser) {
    setActionLoading(user.id)
    try {
      if (user.suspended) {
        await axiosInstance.patch(ADMIN_USER_UNSUSPEND(user.id))
      } else {
        await axiosInstance.patch(ADMIN_USER_SUSPEND(user.id))
      }
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, suspended: !u.suspended } : u)),
      )
    } catch {
      setError('Failed to update suspension')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div>
      <h1 className="mb-6 font-goblin text-2xl">Users</h1>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Icon
            icon="mdi:magnify"
            width={18}
            className="absolute top-1/2 left-3 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-full rounded-lg border border-border bg-white py-2 pr-3 pl-9 font-martian text-sm outline-none focus:ring-1 focus:ring-brand"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value)
            setPage(1)
          }}
          className="rounded-lg border border-border bg-white px-3 py-2 font-martian text-sm outline-none"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r === 'all' ? 'All Roles' : r.charAt(0).toUpperCase() + r.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="mb-3 font-martian text-sm text-accent-red">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-border bg-white">
        <table className="w-full min-w-[700px] text-left font-martian text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-light text-text-muted">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium">Status</th>
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
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-text-muted">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">{u.name}</td>
                  <td className="px-4 py-3 text-text-secondary">{u.email}</td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      onChange={(e) => changeRole(u.id, e.target.value)}
                      disabled={actionLoading === u.id}
                      className="rounded border border-border bg-surface-light px-2 py-1 text-xs"
                    >
                      <option value="buyer">Buyer</option>
                      <option value="seller">Seller</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-text-muted">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        u.suspended
                          ? 'bg-accent-red/10 text-accent-red'
                          : 'bg-accent-green/10 text-accent-green'
                      }`}
                    >
                      {u.suspended ? 'Suspended' : 'Active'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleSuspend(u)}
                      disabled={actionLoading === u.id}
                      className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                        u.suspended
                          ? 'bg-accent-green/10 text-accent-green hover:bg-accent-green/20'
                          : 'bg-accent-red/10 text-accent-red hover:bg-accent-red/20'
                      } disabled:opacity-50`}
                    >
                      {u.suspended ? 'Unsuspend' : 'Suspend'}
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
