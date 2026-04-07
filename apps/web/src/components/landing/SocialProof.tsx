import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '@iconify/react'

const SELLERS = [
  {
    handle: 'ThriftByKath', name: 'Thrift By Kath', badge: 'Verified Drip',
    banner: '/assets/seller.jpg', items: 156, rating: 4.8,
  },
  {
    handle: 'SoleRepublic', name: 'Sole Republic', badge: 'Top Drip',
    banner: '/assets/showcase.jpg', items: 340, rating: 4.9,
  },
  {
    handle: 'VintageVibesMNL', name: 'Vintage Vibes MNL', badge: 'New Seller',
    banner: '/assets/main.jpg', items: 28, rating: 5.0,
  },
]

export default function SocialProof() {
  const scrollRef = useRef<HTMLDivElement>(null)

  return (
    <section className="bg-surface-light py-16 px-[clamp(1rem,3vw,2rem)]">
      <div className="mx-auto max-w-[1200px]">
        <h2 className="mb-2 text-center font-goblin text-[clamp(1.75rem,4vw,2.5rem)] font-bold">
          Sellers Already Dripping
        </h2>
        <p className="mb-10 text-center font-martian text-sm text-text-muted">
          Join the stores already selling on DripNSole
        </p>

        <div ref={scrollRef} className="flex gap-6 overflow-x-auto pb-4 md:grid md:grid-cols-3 md:overflow-visible [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {SELLERS.map((seller) => (
            <Link
              key={seller.handle}
              to={`/store/${seller.handle}`}
              className="flex min-w-[280px] flex-col overflow-hidden rounded-2xl border border-border bg-white no-underline transition-transform duration-200 hover:-translate-y-1 md:min-w-0"
            >
              <div className="h-32 overflow-hidden">
                <img src={seller.banner} alt="" className="h-full w-full object-cover" />
              </div>
              <div className="p-5">
                <div className="mb-1 flex items-center gap-2">
                  <h3 className="font-martian text-base font-bold text-black">{seller.name}</h3>
                </div>
                <p className="mb-2 font-martian text-xs text-text-muted">@{seller.handle}</p>
                <div className="mb-3 flex items-center gap-3 font-martian text-xs text-text-muted">
                  <span className="rounded-full bg-surface-light px-2 py-0.5 text-[10px] font-bold">{seller.badge}</span>
                  <span>{seller.items} items</span>
                  <span>⭐ {seller.rating}</span>
                </div>
                <button className="w-full cursor-pointer rounded-full bg-black py-2.5 font-martian text-xs font-medium text-white transition-colors hover:bg-brand">
                  Follow
                </button>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
