import { useState } from 'react'
import { Icon } from '@iconify/react'
import { Link } from 'react-router-dom'

export default function Header() {
  const [activeTab, setActiveTab] = useState<'shop' | 'sell'>('shop')
  const [sidebarOpen, setSidebarOpen] = useState(false)

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

          <div className="flex gap-[0.35rem] max-md:hidden">
            <button
              className={`cursor-pointer rounded border-none bg-none px-2 py-2 font-medium ${activeTab === 'shop' ? 'bg-surface-light' : ''} hover:bg-tab-hover`}
              onClick={() => setActiveTab('shop')}
            >
              SHOP
            </button>
            <button
              className={`cursor-pointer rounded border-none bg-none px-2 py-2 font-medium ${activeTab === 'sell' ? 'bg-surface-light' : ''} hover:bg-tab-hover`}
              onClick={() => setActiveTab('sell')}
            >
              SELL
            </button>
          </div>

          <div className="relative flex max-w-[600px] flex-1 gap-2 max-md:max-w-none">
            <input
              type="search"
              placeholder="Search"
              className="w-full flex-1 rounded-lg border border-border px-4 py-3 text-sm max-md:hidden"
            />
            <button className="hidden cursor-pointer items-center justify-center border-none bg-none p-2 max-md:flex">
              <Icon icon="ph:magnifying-glass" width={24} height={24} />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button className="flex cursor-pointer items-center justify-center border-none bg-none p-2">
              <Icon icon="mynaui:heart" width={24} height={24} />
            </button>
            <button className="flex cursor-pointer items-center justify-center border-none bg-none p-2 max-md:hidden">
              <Icon icon="clarity:user-line" width={24} height={24} />
            </button>
            <button className="flex cursor-pointer items-center justify-center border-none bg-none p-2">
              <Icon icon="tdesign:cart" width={24} height={24} />
            </button>
          </div>
        </div>
      </nav>

      {activeTab === 'shop' ? (
        <nav className="flex justify-center border-b border-border bg-white py-3 max-md:hidden">
          <div className="mx-auto flex max-w-[1280px] items-center justify-center gap-8 px-4">
            <Link to="/menswear" className="text-sm font-medium text-text-link no-underline transition-colors hover:text-black">Menswear</Link>
            <Link to="/womenswear" className="text-sm font-medium text-text-link no-underline transition-colors hover:text-black">Womenswear</Link>
            <Link to="/kids" className="text-sm font-medium text-text-link no-underline transition-colors hover:text-black">Kids</Link>
            <Link to="/sports" className="text-sm font-medium text-text-link no-underline transition-colors hover:text-black">Sports</Link>
            <Link to="/brands" className="text-sm font-medium text-text-link no-underline transition-colors hover:text-black">Brands</Link>
            <Link to="/sale" className="text-sm font-medium text-accent-red no-underline transition-colors hover:text-accent-red-dark">Sale</Link>
          </div>
        </nav>
      ) : (
        <nav className="flex justify-center border-b border-border bg-white py-3 max-md:hidden">
          <div className="mx-auto flex max-w-[1280px] items-center justify-center gap-8 px-4">
            <Link to="/login" className="text-sm font-medium text-text-link no-underline transition-colors hover:text-black">Log In</Link>
            <Link to="/signup" className="text-sm font-medium text-text-link no-underline transition-colors hover:text-black">Sign Up</Link>
            <Link to="/selling-guide" className="text-sm font-medium text-text-link no-underline transition-colors hover:text-black">Selling Guide</Link>
          </div>
        </nav>
      )}

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

            <div className="p-4">
              <h2 className="mb-3 px-2 text-sm font-semibold uppercase text-text-muted">Account</h2>
              <div className="flex flex-col">
                <Link to="/login" className="flex items-center gap-2 px-2 py-3 text-base text-text-link no-underline">Log in</Link>
                <Link to="/signup" className="flex items-center gap-2 px-2 py-3 text-base text-text-link no-underline">Sign up</Link>
                <Link to="/saved" className="flex items-center gap-2 px-2 py-3 text-base text-text-link no-underline">
                  <Icon icon="mynaui:heart" width={20} height={20} />
                  <span>Saved</span>
                </Link>
              </div>
            </div>

            <div className="h-px bg-border" />

            <div className="flex gap-2 p-4">
              <button
                className={`flex-1 cursor-pointer rounded border-none bg-none py-3 text-center font-medium ${activeTab === 'shop' ? 'bg-surface-light' : ''}`}
                onClick={() => setActiveTab('shop')}
              >
                SHOP
              </button>
              <button
                className={`flex-1 cursor-pointer rounded border-none bg-none py-3 text-center font-medium ${activeTab === 'sell' ? 'bg-surface-light' : ''}`}
                onClick={() => setActiveTab('sell')}
              >
                SELL
              </button>
            </div>

            <div className="px-4 py-2">
              {activeTab === 'shop' ? (
                <>
                  <Link to="/menswear" className="block px-2 py-3 text-base text-text-link no-underline">Menswear</Link>
                  <Link to="/womenswear" className="block px-2 py-3 text-base text-text-link no-underline">Womenswear</Link>
                  <Link to="/kids" className="block px-2 py-3 text-base text-text-link no-underline">Kids</Link>
                  <Link to="/sports" className="block px-2 py-3 text-base text-text-link no-underline">Sports</Link>
                  <Link to="/brands" className="block px-2 py-3 text-base text-text-link no-underline">Brands</Link>
                  <Link to="/sale" className="block px-2 py-3 text-base text-accent-red no-underline">Sale</Link>
                </>
              ) : (
                <Link to="/selling-guide" className="block px-2 py-3 text-base text-text-link no-underline">Selling Guide</Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
