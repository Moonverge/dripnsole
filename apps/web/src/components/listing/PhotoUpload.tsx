import { useState } from 'react'
import { Icon } from '@iconify/react'
import type { PhotoSlot } from '@/types/listing'

const SHOT_LIST: { slot: PhotoSlot; label: string; required: boolean }[] = [
  { slot: 'front', label: 'Front', required: true },
  { slot: 'back', label: 'Back', required: true },
  { slot: 'left', label: 'Left Side', required: true },
  { slot: 'right', label: 'Right Side', required: false },
  { slot: 'sole_hem', label: 'Sole / Hem', required: false },
  { slot: 'tag_label', label: 'Tag / Label', required: false },
  { slot: 'defect', label: 'Defect Close-up', required: false },
  { slot: 'detail', label: 'Detail Shot', required: false },
]

interface PhotoUploadProps {
  photos: Map<PhotoSlot, File>
  onChange: (photos: Map<PhotoSlot, File>) => void
}

export default function PhotoUpload({ photos, onChange }: PhotoUploadProps) {
  const [previews, setPreviews] = useState<Map<PhotoSlot, string>>(new Map())

  function handleFileSelect(slot: PhotoSlot, file: File) {
    const updated = new Map(photos)
    updated.set(slot, file)
    onChange(updated)

    const prevs = new Map(previews)
    prevs.set(slot, URL.createObjectURL(file))
    setPreviews(prevs)
  }

  function handleRemove(slot: PhotoSlot) {
    const updated = new Map(photos)
    updated.delete(slot)
    onChange(updated)

    const prevs = new Map(previews)
    prevs.delete(slot)
    setPreviews(prevs)
  }

  return (
    <div>
      <p className="mb-1 font-martian text-xs text-text-muted">
        Min 3, max 8 photos. Follow the shot list for best spin view.
      </p>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {SHOT_LIST.map(({ slot, label, required }) => (
          <div key={slot} className="relative">
            {previews.has(slot) ? (
              <div className="group relative aspect-square overflow-hidden rounded-xl">
                <img src={previews.get(slot)} alt={label} className="h-full w-full object-cover" />
                <button
                  onClick={() => handleRemove(slot)}
                  className="absolute right-2 top-2 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-black/70 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <Icon icon="mdi:close" width={14} className="text-white" />
                </button>
                <span className="absolute bottom-2 left-2 rounded bg-black/70 px-2 py-0.5 font-martian text-[10px] text-white">
                  {label}
                </span>
              </div>
            ) : (
              <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-surface-light transition-colors hover:border-brand">
                <Icon icon="mdi:camera-plus-outline" width={24} className="text-text-muted" />
                <span className="mt-1 font-martian text-[10px] text-text-muted">{label}</span>
                {required && (
                  <span className="font-martian text-[9px] text-accent-red">Required</span>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileSelect(slot, file)
                  }}
                  className="hidden"
                />
              </label>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
