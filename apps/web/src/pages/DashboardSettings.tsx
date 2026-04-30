import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { useCrossPostStore } from '@/stores/cross-post.store'

export default function DashboardSettings() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { meta, metaLoading, metaError, fetchMeta, fetchOAuthUrl, clearMeta } = useCrossPostStore()

  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'err'; message: string } | null>(null)

  useEffect(() => {
    fetchMeta()
  }, [fetchMeta])

  useEffect(() => {
    const err = searchParams.get('meta_error')
    const ok = searchParams.get('meta_connected')
    if (err) {
      setFeedback({ kind: 'err', message: decodeURIComponent(err) })
      searchParams.delete('meta_error')
      searchParams.delete('meta_connected')
      setSearchParams(searchParams, { replace: true })
    } else if (ok === '1') {
      setFeedback({ kind: 'ok', message: 'Facebook Page connected. Page token is stored encrypted.' })
      searchParams.delete('meta_connected')
      setSearchParams(searchParams, { replace: true })
      void fetchMeta()
    }
  }, [searchParams, setSearchParams, fetchMeta])

  async function handleConnect() {
    setFeedback(null)
    const url = await fetchOAuthUrl()
    if (!url) {
      setFeedback({
        kind: 'err',
        message:
          'Could not start Meta login. Set META_APP_ID and META_APP_SECRET on the server and add this redirect URI in your Meta app: META_REDIRECT_URI.',
      })
      return
    }
    window.location.href = url
  }

  async function handleDisconnect() {
    if (!confirm('Disconnect Meta and remove stored Page access from DripNSole?')) return
    setFeedback(null)
    try {
      await clearMeta()
      await fetchMeta()
      setFeedback({ kind: 'ok', message: 'Disconnected.' })
    } catch {
      setFeedback({ kind: 'err', message: metaError ?? 'Failed to disconnect' })
    }
  }

  const connected = Boolean(meta?.connected)

  return (
    <div>
      <h1 className="mb-6 font-goblin text-2xl font-bold md:text-3xl">Settings</h1>

      <section className="rounded-3xl border border-border bg-white p-6 md:p-8">
        <h2 className="mb-2 font-martian text-lg font-bold">Cross-post (Meta)</h2>
        <p className="mb-6 max-w-xl font-martian text-sm leading-relaxed text-text-muted">
          Sign in with Facebook once. We store an encrypted{' '}
          <span className="font-semibold text-black">Page access token</span> and post through the
          official Graph API—no middleware.
        </p>

        <div className="mb-6 grid gap-3 md:grid-cols-2">
          <div
            className={`flex items-center gap-3 rounded-2xl border px-4 py-4 ${connected ? 'border-accent-green/60 bg-green-50/80' : 'border-border bg-surface-light/50'}`}
          >
            <Icon icon="mdi:facebook" width={28} className="text-[#1877F2]" />
            <div className="flex-1">
              <p className="font-martian text-sm font-medium">Facebook Page</p>
              <p className="font-martian text-xs text-text-muted">
                {connected ? 'Ready to post' : 'Not connected'}
              </p>
            </div>
            {connected && (
              <Icon icon="mdi:check-decagram" width={22} className="text-accent-green" />
            )}
          </div>
          <div
            className={`flex items-center gap-3 rounded-2xl border px-4 py-4 ${connected && meta?.hasInstagram ? 'border-accent-green/60 bg-green-50/80' : 'border-border bg-surface-light/50'}`}
          >
            <Icon icon="mdi:instagram" width={28} className="text-[#E4405F]" />
            <div className="flex-1">
              <p className="font-martian text-sm font-medium">Instagram Business</p>
              <p className="font-martian text-xs text-text-muted">
                {connected && meta?.hasInstagram
                  ? 'Linked to your Page'
                  : connected
                    ? 'No IG Business on this Page'
                    : 'Not connected'}
              </p>
            </div>
            {connected && meta?.hasInstagram && (
              <Icon icon="mdi:check-decagram" width={22} className="text-accent-green" />
            )}
          </div>
        </div>

        {feedback && (
          <div
            className={`mb-4 rounded-xl px-4 py-3 font-martian text-sm ${feedback.kind === 'ok' ? 'bg-green-50 text-accent-green' : 'bg-red-50 text-accent-red'}`}
          >
            {feedback.message}
          </div>
        )}

        {connected ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1 rounded-xl border border-border bg-surface-light/40 px-4 py-3">
              <p className="font-martian text-[10px] uppercase tracking-wide text-text-faint">
                Connected Page
              </p>
              <p className="truncate font-martian text-sm font-medium">
                {meta?.pageName ?? 'Facebook Page'}
              </p>
              {meta?.connectedAt && (
                <p className="mt-1 font-martian text-[10px] text-text-muted">
                  Since {new Date(meta.connectedAt).toLocaleString()}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={handleDisconnect}
              disabled={metaLoading}
              className="cursor-pointer rounded-full border border-accent-red px-6 py-2.5 font-martian text-sm text-accent-red transition-colors hover:bg-red-50 disabled:opacity-50"
            >
              Disconnect Meta
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <ol className="list-decimal space-y-2 pl-5 font-martian text-sm text-text-secondary">
              <li>Create a Facebook Page (or use an existing one).</li>
              <li>
                Link an Instagram Business account to that Page in Meta Business Suite if you want IG
                posts.
              </li>
              <li>
                Add your app’s redirect URI in Meta Developer Console — must match the server{' '}
                <code className="rounded bg-surface-light px-1 font-mono text-xs">META_REDIRECT_URI</code>.
              </li>
            </ol>
            <button
              type="button"
              onClick={handleConnect}
              disabled={metaLoading}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-black px-8 py-3 font-martian text-sm font-medium text-white transition-colors hover:bg-brand disabled:opacity-50"
            >
              <Icon icon="mdi:facebook" width={20} />
              Continue with Facebook
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
