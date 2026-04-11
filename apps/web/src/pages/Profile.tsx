import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { useAuthStore } from '@/stores/auth.store'
import { useStoreStore } from '@/stores/store.store'
import { axiosInstance } from '@/utils/axios.instance'
import { CHANGE_PASSWORD, UPDATE_PROFILE } from '@/utils/api.routes'
import type { UserRole } from '@/types/user'

type TabId = 'profile' | 'wishlist' | 'following'

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function memberSinceLabel(iso: string) {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
  } catch {
    return iso
  }
}

function roleBadgeClass(role: UserRole) {
  if (role === 'seller') return 'text-accent-green'
  if (role === 'admin') return 'text-accent-red'
  return 'text-text-muted'
}

function roleLabel(role: UserRole) {
  if (role === 'seller') return 'Seller'
  if (role === 'admin') return 'Admin'
  return 'Buyer'
}

function axiosErrorMessage(e: unknown) {
  const ax = e as { response?: { data?: { error?: string } } }
  return ax.response?.data?.error ?? (e instanceof Error ? e.message : 'Something went wrong')
}

export default function Profile() {
  const user = useAuthStore((s) => s.user)
  const refreshProfile = useAuthStore((s) => s.refreshProfile)
  const { myStore, fetchMyStore } = useStoreStore()

  const [tab, setTab] = useState<TabId>('profile')
  const [name, setName] = useState('')
  const [profilePicUrl, setProfilePicUrl] = useState('')
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    setName(user.name)
    setProfilePicUrl(user.profilePic ?? '')
  }, [user])

  useEffect(() => {
    if (!user) return
    if (user.role === 'seller' || user.role === 'admin') {
      void fetchMyStore()
    }
  }, [user, fetchMyStore])

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setProfileLoading(true)
    setProfileSuccess(null)
    setProfileError(null)
    try {
      const body: { name: string; profilePic?: string } = { name: name.trim() }
      const trimmedPic = profilePicUrl.trim()
      if (trimmedPic) body.profilePic = trimmedPic
      await axiosInstance.put(UPDATE_PROFILE(), body)
      await refreshProfile()
      setProfileSuccess('Profile updated.')
    } catch (err) {
      setProfileError(axiosErrorMessage(err))
    } finally {
      setProfileLoading(false)
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPasswordSuccess(null)
    setPasswordError(null)
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.')
      return
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.')
      return
    }
    setPasswordLoading(true)
    try {
      await axiosInstance.post(CHANGE_PASSWORD(), {
        currentPassword,
        newPassword,
      })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordSuccess('Password changed.')
    } catch (err) {
      setPasswordError(axiosErrorMessage(err))
    } finally {
      setPasswordLoading(false)
    }
  }

  if (!user) return null

  const displayName = user.name
  const avatarSrc = user.profilePic
  const initials = initialsFromName(user.name)

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <header className="mb-8 flex flex-col gap-4 border-b border-border pb-8 sm:flex-row sm:items-center">
        <div className="flex shrink-0 justify-center sm:justify-start">
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt=""
              className="h-24 w-24 rounded-full border border-border object-cover"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-brand font-goblin text-2xl font-bold text-white">
              {initials}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <h1 className="font-goblin text-2xl font-bold text-black md:text-3xl">{displayName}</h1>
          <p className="mt-1 font-martian text-sm text-text-secondary">{user.email}</p>
          <p className="mt-1 font-martian text-xs text-text-muted">
            Member since {memberSinceLabel(user.createdAt)}
          </p>
          <span
            className={`mt-3 inline-flex rounded-full border border-border bg-surface-light px-3 py-1 font-martian text-xs font-medium ${roleBadgeClass(user.role)}`}
          >
            {roleLabel(user.role)}
          </span>
        </div>
      </header>

      <div className="mb-6 flex gap-1 border-b border-border">
        {(
          [
            { id: 'profile' as const, label: 'Profile' },
            { id: 'wishlist' as const, label: 'Wishlist' },
            { id: 'following' as const, label: 'Following' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`relative -mb-px border-b-2 px-4 py-3 font-martian text-sm font-medium transition-colors ${
              tab === t.id
                ? 'border-black text-black'
                : 'border-transparent text-text-muted hover:text-text-secondary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="flex flex-col gap-8">
          <form
            onSubmit={handleProfileSubmit}
            className="rounded-xl border border-border bg-white p-6"
          >
            <h2 className="mb-4 font-goblin text-lg font-bold">Edit profile</h2>
            <div className="mb-4">
              <label className="mb-1.5 block font-martian text-xs font-medium text-text-secondary">
                Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-border bg-white px-3 py-2.5 font-martian text-sm outline-none ring-brand/30 focus:ring-2"
                autoComplete="name"
              />
            </div>
            <div className="mb-4">
              <label className="mb-1.5 block font-martian text-xs font-medium text-text-secondary">
                Profile picture URL
              </label>
              <input
                value={profilePicUrl}
                onChange={(e) => setProfilePicUrl(e.target.value)}
                type="url"
                placeholder="https://"
                className="w-full rounded-lg border border-border bg-white px-3 py-2.5 font-martian text-sm outline-none ring-brand/30 focus:ring-2"
                autoComplete="off"
              />
            </div>
            {profileError && (
              <p className="mb-3 font-martian text-sm text-accent-red">{profileError}</p>
            )}
            {profileSuccess && (
              <p className="mb-3 font-martian text-sm text-accent-green">{profileSuccess}</p>
            )}
            <button
              type="submit"
              disabled={profileLoading}
              className="cursor-pointer rounded-full bg-brand px-6 py-2.5 font-martian text-sm font-medium text-white transition-colors hover:bg-black disabled:opacity-50"
            >
              {profileLoading ? 'Saving…' : 'Save profile'}
            </button>
          </form>

          <form
            onSubmit={handlePasswordSubmit}
            className="rounded-xl border border-border bg-white p-6"
          >
            <h2 className="mb-4 font-goblin text-lg font-bold">Change password</h2>
            <div className="mb-4">
              <label className="mb-1.5 block font-martian text-xs font-medium text-text-secondary">
                Current password
              </label>
              <input
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                type="password"
                className="w-full rounded-lg border border-border bg-white px-3 py-2.5 font-martian text-sm outline-none ring-brand/30 focus:ring-2"
                autoComplete="current-password"
              />
            </div>
            <div className="mb-4">
              <label className="mb-1.5 block font-martian text-xs font-medium text-text-secondary">
                New password
              </label>
              <input
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                type="password"
                className="w-full rounded-lg border border-border bg-white px-3 py-2.5 font-martian text-sm outline-none ring-brand/30 focus:ring-2"
                autoComplete="new-password"
              />
            </div>
            <div className="mb-4">
              <label className="mb-1.5 block font-martian text-xs font-medium text-text-secondary">
                Confirm new password
              </label>
              <input
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                type="password"
                className="w-full rounded-lg border border-border bg-white px-3 py-2.5 font-martian text-sm outline-none ring-brand/30 focus:ring-2"
                autoComplete="new-password"
              />
            </div>
            {passwordError && (
              <p className="mb-3 font-martian text-sm text-accent-red">{passwordError}</p>
            )}
            {passwordSuccess && (
              <p className="mb-3 font-martian text-sm text-accent-green">{passwordSuccess}</p>
            )}
            <button
              type="submit"
              disabled={passwordLoading}
              className="cursor-pointer rounded-full border border-border bg-white px-6 py-2.5 font-martian text-sm font-medium text-black transition-colors hover:bg-surface-light disabled:opacity-50"
            >
              {passwordLoading ? 'Updating…' : 'Update password'}
            </button>
          </form>

          {user.role === 'buyer' && (
            <div className="rounded-xl border border-border bg-surface-light p-6">
              <p className="mb-4 font-martian text-sm text-text-secondary">
                Sell your pieces and reach buyers across the community.
              </p>
              <Link
                to="/store-setup"
                className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-2.5 font-martian text-sm font-medium text-white no-underline transition-colors hover:bg-black"
              >
                Become a Seller
                <Icon icon="mdi:arrow-right" width={18} />
              </Link>
            </div>
          )}

          {(user.role === 'seller' || user.role === 'admin') && (
            <div className="flex flex-wrap gap-3">
              {myStore && (
                <Link
                  to={`/store/${myStore.handle}`}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-5 py-2.5 font-martian text-sm font-medium text-black no-underline transition-colors hover:bg-surface-light"
                >
                  <Icon icon="mdi:storefront-outline" width={18} />
                  View My Store
                </Link>
              )}
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 font-martian text-sm font-medium text-white no-underline transition-colors hover:bg-black"
              >
                <Icon icon="mdi:view-dashboard-outline" width={18} />
                Go to Dashboard
              </Link>
            </div>
          )}
        </div>
      )}

      {tab === 'wishlist' && (
        <div className="rounded-xl border border-border bg-surface-light p-8 text-center">
          <p className="mb-4 font-martian text-sm text-text-secondary">
            View saved listings and track items you love.
          </p>
          <Link
            to="/wishlist"
            className="inline-flex items-center gap-2 font-martian text-sm font-medium text-text-link no-underline hover:underline"
          >
            View your wishlist
            <Icon icon="mdi:arrow-right" width={18} />
          </Link>
        </div>
      )}

      {tab === 'following' && (
        <div className="rounded-xl border border-border bg-surface-light p-8 text-center">
          <p className="mb-4 font-martian text-sm text-text-secondary">
            See new drops from stores you follow.
          </p>
          <Link
            to="/following"
            className="inline-flex items-center gap-2 font-martian text-sm font-medium text-text-link no-underline hover:underline"
          >
            View stores you follow
            <Icon icon="mdi:arrow-right" width={18} />
          </Link>
        </div>
      )}
    </div>
  )
}
