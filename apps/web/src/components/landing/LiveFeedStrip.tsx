import { Link } from 'react-router-dom'

const FEED_ITEMS = [
  { id: 'l1', text: '@ThriftByKath just listed Vintage Nike Air Max 97 — ₱4,500' },
  { id: 'l3', text: '@ThriftByKath marked Jordan 1 Chicago RESERVED' },
  { id: 'l5', text: '@ThriftByKath dropped Vintage Metallica Band Tee — ₱1,200' },
  { id: 'l8', text: '@SoleRepublic listed Nike Tech Fleece Joggers — ₱2,200' },
  { id: 'l2', text: '@SoleRepublic just listed Supreme Box Logo Tee — ₱6,500' },
  { id: 'l6', text: '@SoleRepublic marked Levis 501 SOLD' },
  { id: 'l4', text: '@SoleRepublic dropped Bape Shark Hoodie — ₱8,500' },
  { id: 'l7', text: '@ThriftByKath listed Champion Reverse Weave — ₱950' },
]

export default function LiveFeedStrip() {
  const doubled = [...FEED_ITEMS, ...FEED_ITEMS]

  return (
    <div className="overflow-hidden bg-brand py-3 [&:hover_.ticker]:![animation-play-state:paused]">
      <div className="ticker flex w-max animate-[ticker_30s_linear_infinite] gap-8">
        {doubled.map((item, i) => (
          <Link
            key={`${item.id}-${i}`}
            to={`/listing/${item.id}`}
            className="flex shrink-0 items-center gap-2 whitespace-nowrap font-martian text-xs text-white/90 no-underline transition-colors hover:text-white"
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent-green" />
            {item.text}
          </Link>
        ))}
      </div>
    </div>
  )
}
