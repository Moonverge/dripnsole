import { Link, useLocation } from 'react-router-dom'
import { Icon } from '@iconify/react'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'My Store', icon: 'mdi:store-outline' },
  { to: '/dashboard/listings', label: 'My Listings', icon: 'mdi:view-grid-outline' },
  { to: '/dashboard/create', label: 'New Listing', icon: 'mdi:plus-circle-outline' },
  { to: '/dashboard/social', label: 'Post to Social', icon: 'mdi:share-variant-outline' },
  { to: '/messages', label: 'Messages', icon: 'mdi:message-outline' },
  { to: '/dashboard/settings', label: 'Settings', icon: 'mdi:cog-outline' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation()

  function isActive(path: string) {
    if (path === '/dashboard') return location.pathname === '/dashboard'
    return location.pathname.startsWith(path)
  }

  return (
    <div className="mx-auto flex max-w-[1280px] gap-0 md:gap-8 md:px-8 md:py-8">
      <aside className="hidden w-56 shrink-0 md:block">
        <nav className="sticky top-24 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 font-martian text-sm no-underline transition-colors ${
                isActive(item.to)
                  ? 'bg-black text-white'
                  : 'text-text-secondary hover:bg-surface-light'
              }`}
            >
              <Icon icon={item.icon} width={20} height={20} />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="hidden w-px bg-border md:block" />

      <main className="min-h-[60vh] flex-1 px-4 py-4 md:px-0 md:py-0">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-white md:hidden">
        {NAV_ITEMS.slice(0, 5).map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] no-underline ${
              isActive(item.to) ? 'text-black' : 'text-text-muted'
            }`}
          >
            <Icon icon={item.icon} width={20} height={20} />
            <span className="font-martian">{item.label.split(' ')[0]}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
