import { Link, Navigate, useLocation } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { useAuthStore } from '@/stores/auth.store'

const NAV_ITEMS = [
  { to: '/admin', label: 'Overview', icon: 'mdi:chart-box-outline' },
  { to: '/admin/users', label: 'Users', icon: 'mdi:account-group-outline' },
  { to: '/admin/listings', label: 'Listings', icon: 'mdi:shoe-sneaker' },
  { to: '/admin/stores', label: 'Stores', icon: 'mdi:storefront-outline' },
  { to: '/admin/reports', label: 'Reports', icon: 'mdi:flag-outline' },
  { to: '/admin/settings', label: 'Settings', icon: 'mdi:cog-outline' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const user = useAuthStore((s) => s.user)

  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  function isActive(path: string) {
    if (path === '/admin') return location.pathname === '/admin'
    return location.pathname.startsWith(path)
  }

  return (
    <div className="mx-auto flex max-w-[1280px] gap-0 md:gap-8 md:px-8 md:py-8">
      <aside className="hidden w-56 shrink-0 md:block">
        <div className="sticky top-24 flex flex-col gap-1">
          <span className="mb-2 px-4 font-goblin text-xs tracking-widest text-accent-red uppercase">
            Admin Panel
          </span>
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 font-martian text-sm no-underline transition-colors ${
                  isActive(item.to)
                    ? 'bg-accent-red/10 text-accent-red'
                    : 'text-text-secondary hover:bg-surface-light'
                }`}
              >
                <Icon icon={item.icon} width={20} height={20} />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </aside>

      <div className="hidden w-px bg-border md:block" />

      <main className="min-h-[60vh] flex-1 px-4 py-4 md:px-0 md:py-0">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-white md:hidden">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] no-underline ${
              isActive(item.to) ? 'text-accent-red' : 'text-text-muted'
            }`}
          >
            <Icon icon={item.icon} width={20} height={20} />
            <span className="font-martian">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
