import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { useAuthStore } from '@/stores/auth.store'
import NotificationBell from '@/components/common/NotificationBell'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <nav className="sticky top-0 z-40 border-b border-border bg-white">
        <div className="mx-auto flex max-w-[1280px] items-center gap-4 px-4 py-3 md:gap-6 md:px-8">
          <button
            className="flex cursor-pointer items-center border-none bg-none p-1 md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Icon icon="heroicons:bars-3" width={24} height={24} />
          </button>

          <Link to="/" className="shrink-0 no-underline text-black">
            <span className="font-martian text-lg font-bold md:text-xl">DripNSole</span>
          </Link>

          {user && (
            <div className="hidden gap-1 md:flex">
              <Link to="/explore" className="rounded px-3 py-2 font-martian text-sm font-medium no-underline text-black hover:bg-surface-light">SHOP</Link>
              {user.isSeller && (
                <Link to="/dashboard" className="rounded px-3 py-2 font-martian text-sm font-medium no-underline text-black hover:bg-surface-light">SELL</Link>
              )}
            </div>
          )}

          <form onSubmit={handleSearch} className="relative hidden flex-1 md:flex md:max-w-[500px]">
            <input
              type="search"
              placeholder="Search drips..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-border px-4 py-2.5 font-martian text-sm"
            />
          </form>

          <div className="ml-auto flex items-center gap-2 md:gap-3">
            <button
              className="flex cursor-pointer items-center border-none bg-none p-2 md:hidden"
              onClick={() => navigate('/search')}
            >
              <Icon icon="ph:magnifying-glass" width={22} height={22} />
            </button>

            {user ? (
              <>
                <Link to="/wishlist" className="flex items-center p-2 text-black">
                  <Icon icon="mynaui:heart" width={22} height={22} />
                </Link>
                <NotificationBell />
                <Link to="/messages" className="flex items-center p-2 text-black">
                  <Icon icon="mdi:message-outline" width={22} height={22} />
                </Link>
                <Link to="/dashboard" className="hidden items-center p-2 text-black md:flex">
                  <Icon icon="clarity:user-line" width={22} height={22} />
                </Link>
              </>
            ) : (
              <div className="flex gap-2">
                <Link to="/login" className="rounded-full bg-black px-4 py-2 font-martian text-xs text-white no-underline">Log In</Link>
                <Link to="/signup" className="hidden rounded-full border border-black px-4 py-2 font-martian text-xs text-black no-underline md:block">Sign Up</Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)}>
          <div className="fixed inset-y-0 left-0 w-72 overflow-y-auto bg-white" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border p-4">
              <span className="font-martian text-lg font-bold">DripNSole</span>
              <button className="cursor-pointer border-none bg-none p-2" onClick={() => setSidebarOpen(false)}>
                <Icon icon="heroicons:x-mark" width={24} height={24} />
              </button>
            </div>

            {user ? (
              <div className="p-4">
                <p className="mb-1 font-martian text-sm font-bold">{user.name}</p>
                <p className="mb-4 font-martian text-xs text-text-muted">{user.email}</p>
                <nav className="flex flex-col gap-1">
                  <Link to="/explore" onClick={() => setSidebarOpen(false)} className="rounded px-3 py-2.5 font-martian text-sm text-text-link no-underline hover:bg-surface-light">Explore</Link>
                  <Link to="/following" onClick={() => setSidebarOpen(false)} className="rounded px-3 py-2.5 font-martian text-sm text-text-link no-underline hover:bg-surface-light">Following</Link>
                  <Link to="/wishlist" onClick={() => setSidebarOpen(false)} className="rounded px-3 py-2.5 font-martian text-sm text-text-link no-underline hover:bg-surface-light">Wishlist</Link>
                  <Link to="/messages" onClick={() => setSidebarOpen(false)} className="rounded px-3 py-2.5 font-martian text-sm text-text-link no-underline hover:bg-surface-light">Messages</Link>
                  {user.isSeller && (
                    <Link to="/dashboard" onClick={() => setSidebarOpen(false)} className="rounded px-3 py-2.5 font-martian text-sm text-text-link no-underline hover:bg-surface-light">Dashboard</Link>
                  )}
                  {!user.isSeller && (
                    <Link to="/store-setup" onClick={() => setSidebarOpen(false)} className="rounded px-3 py-2.5 font-martian text-sm text-brand no-underline hover:bg-surface-light">Start Selling</Link>
                  )}
                  <div className="my-2 h-px bg-border" />
                  <button
                    onClick={() => { logout(); setSidebarOpen(false); navigate('/') }}
                    className="cursor-pointer rounded border-none bg-none px-3 py-2.5 text-left font-martian text-sm text-accent-red"
                  >
                    Log Out
                  </button>
                </nav>
              </div>
            ) : (
              <div className="p-4">
                <Link to="/login" onClick={() => setSidebarOpen(false)} className="mb-2 block rounded-full bg-black py-3 text-center font-martian text-sm text-white no-underline">Log In</Link>
                <Link to="/signup" onClick={() => setSidebarOpen(false)} className="block rounded-full border border-black py-3 text-center font-martian text-sm text-black no-underline">Sign Up</Link>
              </div>
            )}
          </div>
        </div>
      )}

      {children}
    </div>
  )
}
