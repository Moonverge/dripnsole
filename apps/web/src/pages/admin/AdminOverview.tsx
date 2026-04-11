import { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import { axiosInstance } from '@/utils/axios.instance'
import { ADMIN_OVERVIEW } from '@/utils/api.routes'

interface OverviewStats {
  totalUsers: number
  totalSellers: number
  totalListings: number
  transactionsThisMonth: number
  newSignupsToday: number
  activeListings: number
}

const STAT_CARDS: { key: keyof OverviewStats; label: string; icon: string; color: string }[] = [
  { key: 'totalUsers', label: 'Total Users', icon: 'mdi:account-group', color: 'text-brand' },
  { key: 'totalSellers', label: 'Total Sellers', icon: 'mdi:storefront', color: 'text-accent-green' },
  { key: 'totalListings', label: 'Total Listings', icon: 'mdi:shoe-sneaker', color: 'text-text-link' },
  { key: 'transactionsThisMonth', label: 'Transactions This Month', icon: 'mdi:receipt-text', color: 'text-accent-red' },
  { key: 'newSignupsToday', label: 'New Signups Today', icon: 'mdi:account-plus', color: 'text-brand' },
  { key: 'activeListings', label: 'Active Listings', icon: 'mdi:check-circle', color: 'text-accent-green' },
]

export default function AdminOverview() {
  const [stats, setStats] = useState<OverviewStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchOverview() {
      try {
        const { data } = await axiosInstance.get(ADMIN_OVERVIEW())
        setStats(data.data)
      } catch {
        setError('Failed to load overview')
      } finally {
        setLoading(false)
      }
    }
    fetchOverview()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Icon icon="mdi:loading" width={32} className="animate-spin text-text-muted" />
      </div>
    )
  }

  if (error) {
    return <p className="py-10 text-center font-martian text-sm text-accent-red">{error}</p>
  }

  return (
    <div>
      <h1 className="mb-6 font-goblin text-2xl">Overview</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {STAT_CARDS.map((card) => (
          <div
            key={card.key}
            className="flex items-center gap-4 rounded-xl border border-border bg-white p-5"
          >
            <div className={`rounded-lg bg-surface-light p-3 ${card.color}`}>
              <Icon icon={card.icon} width={24} />
            </div>
            <div>
              <p className="font-goblin text-2xl">{stats?.[card.key] ?? 0}</p>
              <p className="font-martian text-xs text-text-muted">{card.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
