import { useState, useRef, useCallback } from 'react'
import { Icon } from '@iconify/react'

interface PhotoViewerProps {
  photos: string[]
  size?: 'sm' | 'md' | 'lg'
}

const SIZE_CLASS = {
  sm: 'h-48 w-48',
  md: 'h-72 w-72 md:h-96 md:w-96',
  lg: 'h-80 w-full md:h-[500px]',
}

export default function PhotoViewer({ photos, size = 'md' }: PhotoViewerProps) {
  const [index, setIndex] = useState(0)
  const dragRef = useRef({ startX: 0, dragging: false })
  const sizeClass = SIZE_CLASS[size]

  const go = useCallback(
    (dir: 1 | -1) => setIndex((i) => (i + dir + photos.length) % photos.length),
    [photos.length],
  )

  function onPointerDown(e: React.PointerEvent) {
    dragRef.current = { startX: e.clientX, dragging: true }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  function onPointerUp(e: React.PointerEvent) {
    if (!dragRef.current.dragging) return
    dragRef.current.dragging = false
    const dx = e.clientX - dragRef.current.startX
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1)
  }

  if (photos.length === 0) {
    return (
      <div
        className={`${sizeClass} flex items-center justify-center rounded-2xl bg-surface-light font-martian text-sm text-text-muted`}
      >
        No photos
      </div>
    )
  }

  if (photos.length === 1) {
    return (
      <div className={`${sizeClass} overflow-hidden rounded-2xl bg-surface-light`}>
        <img src={photos[0]} alt="Item" className="h-full w-full object-cover object-center" />
      </div>
    )
  }

  return (
    <div
      className={`${sizeClass} group relative select-none overflow-hidden rounded-2xl bg-surface-light`}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
    >
      <img
        src={photos[index]}
        alt={`Photo ${index + 1}`}
        draggable={false}
        className="h-full w-full object-cover object-center transition-opacity duration-200"
      />

      <button
        onClick={(e) => {
          e.stopPropagation()
          go(-1)
        }}
        className="absolute left-2 top-1/2 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/50 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"
      >
        <Icon icon="mdi:chevron-left" width={18} />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation()
          go(1)
        }}
        className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/50 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"
      >
        <Icon icon="mdi:chevron-right" width={18} />
      </button>

      <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
        {photos.map((_, i) => (
          <button
            key={i}
            onClick={(e) => {
              e.stopPropagation()
              setIndex(i)
            }}
            className={`h-1.5 cursor-pointer rounded-full transition-all ${
              i === index ? 'w-4 bg-white' : 'w-1.5 bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
