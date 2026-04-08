import { useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { useAuthStore } from '@/stores/auth.store'
import { useWishlistStore } from '@/stores/wishlist.store'

const products = [
  {
    id: 'l1',
    name: 'Vintage Nike Air Max 97',
    price: 4500,
    seller: 'ThriftByKath',
    condition: 'VNDS',
    image: '/assets/products/vintageairmax.jpg',
  },
  {
    id: 'l2',
    name: 'Supreme Box Logo Tee',
    price: 6500,
    seller: 'SoleRepublic',
    condition: 'BNWT',
    image: '/assets/products/supremeboxtee.jpg',
  },
  {
    id: 'l3',
    name: 'Jordan 1 Chicago',
    price: 12000,
    seller: 'ThriftByKath',
    condition: '9/10',
    image: '/assets/products/jordan1chicago.jpg',
  },
  {
    id: 'l4',
    name: 'Bape Shark Hoodie',
    price: 8500,
    seller: 'SoleRepublic',
    condition: '8/10',
    image: '/assets/products/bapehoodie.jpg',
  },
  {
    id: 'l5',
    name: 'Vintage Metallica Band Tee',
    price: 1200,
    seller: 'ThriftByKath',
    condition: 'Thrifted',
    image: '/assets/products/vintageband.jpg',
  },
  {
    id: 'l6',
    name: 'Levis 501 Original Fit',
    price: 1800,
    seller: 'SoleRepublic',
    condition: '7/10',
    image: '/assets/products/levis.jpg',
  },
  {
    id: 'l7',
    name: 'Champion Reverse Weave',
    price: 950,
    seller: 'ThriftByKath',
    condition: 'Thrifted',
    image: '/assets/products/championsweatshirt.jpg',
  },
  {
    id: 'l8',
    name: 'Nike Tech Fleece Joggers',
    price: 2200,
    seller: 'SoleRepublic',
    condition: 'VNDS',
    image: '/assets/products/niketechfleece.jpg',
  },
]

export default function FreshDropsCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const user = useAuthStore((s) => s.user)
  const { toggleSave, isSaved } = useWishlistStore()
  const navigate = useNavigate()

  function scroll(direction: 'left' | 'right') {
    scrollRef.current?.scrollBy({ left: direction === 'left' ? -300 : 300, behavior: 'smooth' })
  }

  function handleWishlist(e: React.MouseEvent, listingId: string) {
    e.preventDefault()
    e.stopPropagation()
    if (!user) {
      navigate('/login')
      return
    }
    toggleSave(listingId)
  }

  return (
    <section>
      <div className="my-8 mb-6 flex items-center justify-between">
        <h2 className="font-martian text-[1.75rem]">Fresh Drops</h2>
        <Link
          to="/explore"
          className="font-martian text-sm text-brand no-underline hover:underline"
        >
          View All →
        </Link>
      </div>
      <div className="relative flex items-center gap-4">
        <button
          className="absolute -left-5 z-10 hidden h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-border bg-white transition-all duration-200 hover:bg-surface-light md:flex"
          onClick={() => scroll('left')}
        >
          <Icon icon="mdi:chevron-left" width={24} height={24} />
        </button>

        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto py-4 [-ms-overflow-style:none] [scrollbar-width:none] [scroll-snap-type:x_mandatory] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden"
        >
          {products.map((product) => {
            const saved = isSaved(product.id)
            return (
              <Link
                key={product.id}
                to={`/listing/${product.id}`}
                className="flex-[0_0_280px] no-underline text-black transition-transform duration-200 [scroll-snap-align:start] hover:-translate-y-1"
              >
                <div className="relative aspect-square overflow-hidden rounded-2xl bg-surface-light">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover object-center"
                  />
                  <span className="absolute left-3 top-3 rounded-full bg-black/70 px-2.5 py-1 font-martian text-[10px] font-bold text-white">
                    {product.condition}
                  </span>
                  <button
                    onClick={(e) => handleWishlist(e, product.id)}
                    className="absolute right-3 top-3 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/80 backdrop-blur-sm transition-colors hover:bg-white"
                  >
                    <Icon
                      icon={saved ? 'mdi:heart' : 'mdi:heart-outline'}
                      width={18}
                      className={saved ? 'text-accent-red' : 'text-text-muted'}
                    />
                  </button>
                </div>
                <div className="mt-4">
                  <h3 className="font-martian text-sm">{product.name}</h3>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      navigate(`/store/${product.seller}`)
                    }}
                    className="mt-0.5 block w-full cursor-pointer border-none bg-transparent p-0 text-left font-martian text-xs text-text-muted hover:text-brand"
                  >
                    @{product.seller}
                  </button>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="font-martian text-lg font-bold">
                      ₱{product.price.toLocaleString()}
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}

          <Link
            to="/explore"
            className="flex flex-[0_0_280px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border no-underline transition-colors hover:border-brand hover:bg-surface-light"
          >
            <Icon icon="mdi:arrow-right" width={32} className="mb-2 text-text-muted" />
            <span className="font-martian text-sm font-medium text-text-muted">View All Drips</span>
          </Link>
        </div>

        <button
          className="absolute -right-5 z-10 hidden h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-border bg-white transition-all duration-200 hover:bg-surface-light md:flex"
          onClick={() => scroll('right')}
        >
          <Icon icon="mdi:chevron-right" width={24} height={24} />
        </button>
      </div>
    </section>
  )
}
