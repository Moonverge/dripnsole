import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { useNotificationStore } from '@/stores/notification.store'

export default function NotificationBell() {
  const { notifications, fetchNotifications, markAsRead, markAllRead, unreadCount } =
    useNotificationStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const count = unreadCount()

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        className="relative flex cursor-pointer items-center justify-center border-none bg-none p-2"
        onClick={() => setOpen(!open)}
      >
        <Icon icon="mdi:bell-outline" width={24} height={24} />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent-red text-[10px] font-bold text-white">
            {count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-xl border border-border bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="font-martian text-sm font-bold">Notifications</span>
            {count > 0 && (
              <button
                className="cursor-pointer border-none bg-none font-martian text-xs text-brand hover:underline"
                onClick={() => markAllRead()}
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-4 text-center font-martian text-sm text-text-muted">
                No notifications
              </p>
            ) : (
              notifications.map((n) => (
                <Link
                  key={n.id}
                  to={n.linkTo}
                  className={`block border-b border-border/50 px-4 py-3 no-underline transition-colors hover:bg-surface-light ${!n.read ? 'bg-blue-50' : ''}`}
                  onClick={() => {
                    markAsRead(n.id)
                    setOpen(false)
                  }}
                >
                  <p className="font-martian text-xs font-semibold text-text-primary">{n.title}</p>
                  <p className="mt-0.5 font-martian text-xs text-text-muted">{n.body}</p>
                  <p className="mt-1 font-martian text-[10px] text-text-faint">
                    {new Date(n.createdAt).toLocaleDateString()}
                  </p>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
