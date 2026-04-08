import { useState } from 'react'
import { Icon } from '@iconify/react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'

export default function Header() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showUserMenu, setShowUserMenu] = useState(false)

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (searchQuery.trim()) navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
  }

  function handleSellClick() {
    if (!user) {
      navigate('/signup')
      return
    }
    if (user.isSeller) {
      navigate('/dashboard')
      return
    }
    navigate('/store-setup')
  }

  const initials = user?.name?.slice(0, 2).toUpperCase() || ''

  return (
    <>
      <nav className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-[1280px] items-center gap-8 px-8 py-4 max-md:gap-4 max-md:px-3 max-md:py-3">
          <button
            className="hidden cursor-pointer border-none bg-none p-2 max-md:block"
            onClick={() => setSidebarOpen(true)}
          >
            <Icon icon="heroicons:bars-3" width={24} height={24} />
          </button>

          <Link to="/" className="no-underline text-black">
            <span className="font-martian text-2xl font-bold">DripNSole</span>
          </Link>

          <div className="flex gap-1 max-md:hidden">
            <Link
              to="/explore"
              className="rounded px-3 py-2 font-martian text-sm font-medium no-underline text-black hover:bg-surface-light"
            >
              SHOP
            </Link>
            <button
              onClick={handleSellClick}
              className="cursor-pointer rounded border-none bg-none px-3 py-2 font-martian text-sm font-medium hover:bg-surface-light"
            >
              SELL
            </button>
          </div>

          <form
            onSubmit={handleSearch}
            className="relative flex max-w-[500px] flex-1 gap-2 max-md:max-w-none"
          >
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search drips..."
              className="w-full flex-1 rounded-lg border border-border px-4 py-3 font-martian text-sm max-md:hidden"
            />
            <button
              type="button"
              onClick={() => navigate('/search')}
              className="hidden cursor-pointer items-center justify-center border-none bg-none p-2 max-md:flex"
            >
              <Icon icon="ph:magnifying-glass" width={24} height={24} />
            </button>
          </form>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link to="/wishlist" className="flex items-center p-2 text-black">
                  <Icon icon="mynaui:heart" width={22} height={22} />
                </Link>
                <div className="relative max-md:hidden">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-brand font-martian text-xs font-bold text-white"
                  >
                    {initials}
                  </button>
                  {showUserMenu && (
                    <div className="absolute right-0 top-12 z-50 w-48 overflow-hidden rounded-xl border border-border bg-white shadow-lg">
                      <div className="border-b border-border px-4 py-3">
                        <p className="font-martian text-xs font-bold">{user.name}</p>
                        <p className="font-martian text-[10px] text-text-muted">{user.email}</p>
                      </div>
                      {user.isSeller && (
                        <Link
                          to="/dashboard"
                          onClick={() => setShowUserMenu(false)}
                          className="block px-4 py-2.5 font-martian text-sm text-text-link no-underline hover:bg-surface-light"
                        >
                          Dashboard
                        </Link>
                      )}
                      {user.isSeller && (
                        <Link
                          to={`/store/${user.name}`}
                          onClick={() => setShowUserMenu(false)}
                          className="block px-4 py-2.5 font-martian text-sm text-text-link no-underline hover:bg-surface-light"
                        >
                          My Store
                        </Link>
                      )}
                      <Link
                        to="/wishlist"
                        onClick={() => setShowUserMenu(false)}
                        className="block px-4 py-2.5 font-martian text-sm text-text-link no-underline hover:bg-surface-light"
                      >
                        Wishlist
                      </Link>
                      <button
                        onClick={() => {
                          logout()
                          setShowUserMenu(false)
                          navigate('/')
                        }}
                        className="w-full cursor-pointer border-none bg-none px-4 py-2.5 text-left font-martian text-sm text-accent-red hover:bg-surface-light"
                      >
                        Log Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="rounded-full px-4 py-2 font-martian text-xs font-medium no-underline text-black transition-colors hover:bg-surface-light max-md:hidden"
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="rounded-full bg-brand px-4 py-2 font-martian text-xs font-medium text-white no-underline transition-colors hover:bg-black"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      <nav className="flex justify-center border-b border-border bg-white py-3 max-md:hidden">
        <div className="mx-auto flex max-w-[1280px] items-center justify-center gap-8 px-4">
          <Link
            to="/explore?category=Clothes&subcategory=Tops"
            className="text-sm font-medium text-text-link no-underline transition-colors hover:text-black"
          >
            Menswear
          </Link>
          <Link
            to="/explore?category=Clothes&subcategory=Dresses"
            className="text-sm font-medium text-text-link no-underline transition-colors hover:text-black"
          >
            Womenswear
          </Link>
          <Link
            to="/explore?category=Shoes"
            className="text-sm font-medium text-text-link no-underline transition-colors hover:text-black"
          >
            Shoes
          </Link>
          <Link
            to="/explore?category=Clothes&subcategory=Outerwear"
            className="text-sm font-medium text-text-link no-underline transition-colors hover:text-black"
          >
            Outerwear
          </Link>
          <Link
            to="/explore?category=Clothes&subcategory=Accessories"
            className="text-sm font-medium text-text-link no-underline transition-colors hover:text-black"
          >
            Accessories
          </Link>
          <Link
            to="/explore?sort=most_saved"
            className="text-sm font-medium text-accent-red no-underline transition-colors hover:text-accent-red-dark"
          >
            Trending
          </Link>
        </div>
      </nav>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 hidden bg-black/50 max-md:block"
          onClick={() => setSidebarOpen(false)}
        >
          <div
            className="fixed inset-y-0 left-0 w-[280px] overflow-y-auto bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border p-4">
              <span className="font-martian text-xl font-bold">DripNSole</span>
              <button
                className="cursor-pointer border-none bg-none p-2"
                onClick={() => setSidebarOpen(false)}
              >
                <Icon icon="heroicons:x-mark" width={24} height={24} />
              </button>
            </div>

            {user ? (
              <div className="border-b border-border p-4">
                <p className="font-martian text-sm font-bold">{user.name}</p>
                <p className="font-martian text-xs text-text-muted">{user.email}</p>
              </div>
            ) : (
              <div className="flex gap-2 border-b border-border p-4">
                <Link
                  to="/login"
                  onClick={() => setSidebarOpen(false)}
                  className="flex-1 rounded-full border border-border py-2.5 text-center font-martian text-sm font-medium text-black no-underline"
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setSidebarOpen(false)}
                  className="flex-1 rounded-full bg-brand py-2.5 text-center font-martian text-sm font-medium text-white no-underline"
                >
                  Sign Up
                </Link>
              </div>
            )}

            <div className="px-4 py-2">
              <Link
                to="/explore"
                onClick={() => setSidebarOpen(false)}
                className="block rounded px-2 py-3 font-martian text-base text-text-link no-underline hover:bg-surface-light"
              >
                Shop
              </Link>
              <button
                onClick={() => {
                  handleSellClick()
                  setSidebarOpen(false)
                }}
                className="w-full cursor-pointer rounded border-none bg-none px-2 py-3 text-left font-martian text-base text-text-link hover:bg-surface-light"
              >
                Sell
              </button>
              {user && (
                <Link
                  to="/wishlist"
                  onClick={() => setSidebarOpen(false)}
                  className="block rounded px-2 py-3 font-martian text-base text-text-link no-underline hover:bg-surface-light"
                >
                  Wishlist
                </Link>
              )}
              {user && (
                <Link
                  to="/following"
                  onClick={() => setSidebarOpen(false)}
                  className="block rounded px-2 py-3 font-martian text-base text-text-link no-underline hover:bg-surface-light"
                >
                  Following
                </Link>
              )}
              {user?.isSeller && (
                <Link
                  to="/dashboard"
                  onClick={() => setSidebarOpen(false)}
                  className="block rounded px-2 py-3 font-martian text-base text-text-link no-underline hover:bg-surface-light"
                >
                  Dashboard
                </Link>
              )}
              {user && (
                <>
                  <div className="my-2 h-px bg-border" />
                  <button
                    onClick={() => {
                      logout()
                      setSidebarOpen(false)
                      navigate('/')
                    }}
                    className="w-full cursor-pointer rounded border-none bg-none px-2 py-3 text-left font-martian text-base text-accent-red"
                  >
                    Log Out
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
