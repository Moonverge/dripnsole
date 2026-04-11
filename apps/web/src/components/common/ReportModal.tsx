import { useState } from 'react'
import { Icon } from '@iconify/react'
import { axiosInstance } from '@/utils/axios.instance'
import { CREATE_REPORT } from '@/utils/api.routes'

const REASONS = [
  'Fake listing',
  'Wrong condition',
  'Spam',
  'Inappropriate',
  'Other',
]

interface ReportModalProps {
  targetType: 'listing' | 'user'
  targetId: string
  onClose: () => void
}

export default function ReportModal({ targetType, targetId, onClose }: ReportModalProps) {
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!reason) return
    setLoading(true)
    setError('')
    try {
      await axiosInstance.post(CREATE_REPORT(), {
        targetType,
        targetId,
        reason,
        description: description.trim() || undefined,
      })
      setSubmitted(true)
    } catch {
      setError('Failed to submit report. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {submitted ? (
          <div className="text-center">
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-accent-green/10">
              <Icon icon="mdi:check-circle" width={32} className="text-accent-green" />
            </div>
            <h3 className="mb-2 font-goblin text-xl font-bold">Report Submitted</h3>
            <p className="mb-6 font-martian text-sm text-text-muted">
              Thanks for your report. We'll review it within 24 hours.
            </p>
            <button
              onClick={onClose}
              className="cursor-pointer rounded-full bg-black px-6 py-2.5 font-martian text-sm font-medium text-white transition-colors hover:bg-brand"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-goblin text-xl font-bold">Report</h3>
              <button
                onClick={onClose}
                className="cursor-pointer border-none bg-none p-1"
              >
                <Icon icon="heroicons:x-mark" width={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="mb-2 block font-martian text-xs font-medium text-text-secondary">
                  Reason
                </label>
                <div className="flex flex-col gap-2">
                  {REASONS.map((r) => (
                    <label key={r} className="flex cursor-pointer items-center gap-3">
                      <input
                        type="radio"
                        name="reason"
                        value={r}
                        checked={reason === r}
                        onChange={() => setReason(r)}
                        className="accent-brand"
                      />
                      <span className="font-martian text-sm">{r}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <label className="mb-1.5 block font-martian text-xs font-medium text-text-secondary">
                  Description (optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  maxLength={2000}
                  className="w-full resize-none rounded-lg border border-border px-3 py-2.5 font-martian text-sm focus:border-brand focus:outline-none"
                  placeholder="Additional details..."
                />
              </div>
              {error && (
                <p className="mb-3 font-martian text-sm text-accent-red">{error}</p>
              )}
              <button
                type="submit"
                disabled={!reason || loading}
                className="w-full cursor-pointer rounded-full bg-accent-red py-3 font-martian text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-40"
              >
                {loading ? 'Submitting...' : 'Submit Report'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
