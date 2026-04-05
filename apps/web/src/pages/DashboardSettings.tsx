import { useState } from 'react'
import { Icon } from '@iconify/react'
import { useStoreStore } from '@/stores/store.store'

export default function DashboardSettings() {
  const { socialConnections, connectSocial, disconnectSocial } = useStoreStore()
  const [connecting, setConnecting] = useState<string | null>(null)

  const fbConnection = socialConnections.find((c) => c.platform === 'facebook')
  const igConnection = socialConnections.find((c) => c.platform === 'instagram')

  async function handleConnect(platform: 'facebook' | 'instagram') {
    setConnecting(platform)
    await connectSocial(platform)
    setConnecting(null)
  }

  async function handleDisconnect(platform: 'facebook' | 'instagram') {
    await disconnectSocial(platform)
  }

  return (
    <div>
      <h1 className="mb-6 font-goblin text-2xl font-bold md:text-3xl">Settings</h1>

      <section className="mb-8">
        <h2 className="mb-4 font-martian text-base font-bold">Social Connections</h2>
        <p className="mb-4 font-martian text-sm text-text-muted">Connect your Facebook Page and Instagram Business account to cross-post listings.</p>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              <Icon icon="mdi:facebook" width={28} className="text-[#1877F2]" />
              <div>
                <p className="font-martian text-sm font-medium">Facebook Page</p>
                {fbConnection?.connected ? (
                  <p className="font-martian text-xs text-accent-green">{fbConnection.accountName} · Connected</p>
                ) : (
                  <p className="font-martian text-xs text-text-muted">Not connected</p>
                )}
              </div>
            </div>
            {fbConnection?.connected ? (
              <button onClick={() => handleDisconnect('facebook')} className="cursor-pointer rounded-full border border-accent-red px-4 py-2 font-martian text-xs text-accent-red transition-colors hover:bg-red-50">Disconnect</button>
            ) : (
              <button onClick={() => handleConnect('facebook')} disabled={connecting === 'facebook'} className="cursor-pointer rounded-full bg-[#1877F2] px-4 py-2 font-martian text-xs text-white transition-colors hover:bg-[#1565C0] disabled:opacity-50">
                {connecting === 'facebook' ? 'Connecting...' : 'Connect'}
              </button>
            )}
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              <Icon icon="mdi:instagram" width={28} className="text-[#E4405F]" />
              <div>
                <p className="font-martian text-sm font-medium">Instagram Business</p>
                {igConnection?.connected ? (
                  <p className="font-martian text-xs text-accent-green">{igConnection.accountName} · Connected</p>
                ) : (
                  <p className="font-martian text-xs text-text-muted">Not connected</p>
                )}
              </div>
            </div>
            {igConnection?.connected ? (
              <button onClick={() => handleDisconnect('instagram')} className="cursor-pointer rounded-full border border-accent-red px-4 py-2 font-martian text-xs text-accent-red transition-colors hover:bg-red-50">Disconnect</button>
            ) : (
              <button onClick={() => handleConnect('instagram')} disabled={connecting === 'instagram'} className="cursor-pointer rounded-full bg-[#E4405F] px-4 py-2 font-martian text-xs text-white transition-colors hover:bg-[#D32F52] disabled:opacity-50">
                {connecting === 'instagram' ? 'Connecting...' : 'Connect'}
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
