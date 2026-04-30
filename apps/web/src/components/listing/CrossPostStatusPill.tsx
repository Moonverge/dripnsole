import { Icon } from '@iconify/react'
import type { CrossPost, CrossPostPlatform } from '@/types/cross-post'

interface CrossPostStatusPillProps {
  history: CrossPost[]
}

function latestForPlatform(history: CrossPost[], platform: CrossPostPlatform): CrossPost | null {
  return history.find((h) => h.platform === platform) ?? null
}

function relative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

function PlatformBadge({
  post,
  label,
  color,
}: {
  post: CrossPost | null
  label: string
  color: string
}) {
  if (!post) {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full bg-surface-light px-2 py-0.5 font-martian text-[10px] text-text-muted"
        title={`Not posted to ${label}`}
      >
        {label}
      </span>
    )
  }
  if (post.status === 'posted') {
    return (
      <a
        href={post.remoteUrl ?? '#'}
        target={post.remoteUrl ? '_blank' : undefined}
        rel="noreferrer"
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-martian text-[10px] no-underline ${color}`}
        title={`${label} · posted ${relative(post.postedAt ?? post.createdAt)}`}
      >
        <Icon icon="mdi:check" width={10} />
        {label}
      </a>
    )
  }
  if (post.status === 'failed') {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 font-martian text-[10px] text-accent-red"
        title={post.errorMessage ?? `Failed on ${label}`}
      >
        <Icon icon="mdi:alert-circle" width={10} /> {label}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 font-martian text-[10px] text-yellow-700">
      <Icon icon="mdi:loading" width={10} className="animate-spin" /> {label}
    </span>
  )
}

export default function CrossPostStatusPill({ history }: CrossPostStatusPillProps) {
  const fb = latestForPlatform(history, 'facebook')
  const ig = latestForPlatform(history, 'instagram')

  if (!fb && !ig) {
    return <span className="font-martian text-[10px] text-text-faint">Not posted</span>
  }

  return (
    <div className="flex items-center gap-1">
      <PlatformBadge post={fb} label="FB" color="bg-[#1877F2]/10 text-[#1877F2]" />
      <PlatformBadge post={ig} label="IG" color="bg-[#E4405F]/10 text-[#E4405F]" />
    </div>
  )
}
