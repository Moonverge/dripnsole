import { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import { axiosInstance } from '@/utils/axios.instance'
import { ADMIN_SETTINGS, ADMIN_SETTING_UPDATE } from '@/utils/api.routes'

interface Setting {
  key: string
  value: string
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<Setting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function fetchSettings() {
      try {
        const { data } = await axiosInstance.get(ADMIN_SETTINGS())
        const list = data.data?.settings ?? data.data ?? []
        setSettings(list)
      } catch {
        setError('Failed to load settings')
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [])

  async function saveSetting(key: string, value: string) {
    setSaving(true)
    try {
      await axiosInstance.put(ADMIN_SETTING_UPDATE(key), { value })
      setSettings((prev) => prev.map((s) => (s.key === key ? { ...s, value } : s)))
      setEditingKey(null)
    } catch {
      setError('Failed to save setting')
    } finally {
      setSaving(false)
    }
  }

  async function toggleMaintenance(current: string) {
    const newValue = current === 'true' ? 'false' : 'true'
    await saveSetting('maintenance_mode', newValue)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Icon icon="mdi:loading" width={32} className="animate-spin text-text-muted" />
      </div>
    )
  }

  return (
    <div>
      <h1 className="mb-6 font-goblin text-2xl">Settings</h1>

      {error && <p className="mb-3 font-martian text-sm text-accent-red">{error}</p>}

      <div className="flex flex-col gap-4">
        {settings.map((s) => (
          <div
            key={s.key}
            className="flex flex-col gap-3 rounded-xl border border-border bg-white p-5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0 flex-1">
              <p className="font-goblin text-sm">{s.key}</p>
              {editingKey === s.key ? (
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="flex-1 rounded-lg border border-border bg-surface-light px-3 py-1.5 font-martian text-sm outline-none focus:ring-1 focus:ring-brand"
                  />
                  <button
                    onClick={() => saveSetting(s.key, editValue)}
                    disabled={saving}
                    className="rounded-lg bg-brand px-4 py-1.5 font-martian text-sm text-white transition-colors hover:bg-brand/90 disabled:opacity-50"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingKey(null)}
                    className="rounded-lg border border-border px-3 py-1.5 font-martian text-sm transition-colors hover:bg-surface-light"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <p className="mt-1 truncate font-martian text-sm text-text-muted">{s.value}</p>
              )}
            </div>

            {editingKey !== s.key && (
              <div className="shrink-0">
                {s.key === 'maintenance_mode' ? (
                  <button
                    onClick={() => toggleMaintenance(s.value)}
                    disabled={saving}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                      s.value === 'true' ? 'bg-accent-red' : 'bg-border'
                    } disabled:opacity-50`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        s.value === 'true' ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setEditingKey(s.key)
                      setEditValue(s.value)
                    }}
                    className="rounded-lg border border-border px-3 py-1.5 font-martian text-sm transition-colors hover:bg-surface-light"
                  >
                    Edit
                  </button>
                )}
              </div>
            )}
          </div>
        ))}

        {settings.length === 0 && !error && (
          <p className="py-10 text-center font-martian text-sm text-text-muted">
            No settings configured
          </p>
        )}
      </div>
    </div>
  )
}
