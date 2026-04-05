import { useState, useRef, useCallback, useEffect } from 'react'

interface SpinViewerProps {
  photos: string[]
  autoPlay?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function SpinViewer({ photos, autoPlay = false, size = 'md' }: SpinViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const startX = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const sizeClass = {
    sm: 'h-48 w-48',
    md: 'h-72 w-72 md:h-96 md:w-96',
    lg: 'h-80 w-full md:h-[500px]',
  }[size]

  const handleDragStart = useCallback((clientX: number) => {
    setIsDragging(true)
    startX.current = clientX
    if (intervalRef.current) clearInterval(intervalRef.current)
  }, [])

  const handleDragMove = useCallback(
    (clientX: number) => {
      if (!isDragging || photos.length <= 1) return
      const diff = clientX - startX.current
      const threshold = 30
      if (Math.abs(diff) > threshold) {
        const direction = diff > 0 ? -1 : 1
        setCurrentIndex((prev) => (prev + direction + photos.length) % photos.length)
        startX.current = clientX
      }
    },
    [isDragging, photos.length],
  )

  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (autoPlay && photos.length > 1 && !isDragging) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % photos.length)
      }, 2000)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [autoPlay, photos.length, isDragging])

  if (photos.length === 0) {
    return <div className={`${sizeClass} flex items-center justify-center rounded-2xl bg-surface-light font-martian text-sm text-text-muted`}>No photos</div>
  }

  return (
    <div
      ref={containerRef}
      className={`${sizeClass} relative cursor-grab select-none overflow-hidden rounded-2xl bg-surface-light ${isDragging ? 'cursor-grabbing' : ''}`}
      onMouseDown={(e) => handleDragStart(e.clientX)}
      onMouseMove={(e) => handleDragMove(e.clientX)}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
      onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
      onTouchMove={(e) => handleDragMove(e.touches[0].clientX)}
      onTouchEnd={handleDragEnd}
    >
      <img
        src={photos[currentIndex]}
        alt={`View ${currentIndex + 1}`}
        className="h-full w-full object-cover object-center"
        draggable={false}
      />
      {photos.length > 1 && (
        <>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {photos.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all ${i === currentIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`} />
            ))}
          </div>
          <div className="absolute left-3 top-3 rounded-full bg-black/60 px-2 py-0.5 font-martian text-[10px] text-white">
            {currentIndex + 1}/{photos.length}
          </div>
        </>
      )}
    </div>
  )
}
