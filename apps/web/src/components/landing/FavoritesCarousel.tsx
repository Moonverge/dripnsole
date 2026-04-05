import { useRef } from 'react'
import { Icon } from '@iconify/react'

const products = [
  { id: 1, name: 'Vintage Nike Air Max', price: '180', seller: '@sneakerhead', condition: 'Like New', image: '/assets/products/vintageairmax.jpg' },
  { id: 2, name: 'Supreme Box Logo Tee', price: '250', seller: '@hypebeast', condition: 'New', image: '/assets/products/supremeboxtee.jpg' },
  { id: 3, name: 'Jordan 1 Chicago', price: '450', seller: '@kicksdealer', condition: 'Used', image: '/assets/products/jordan1chicago.jpg' },
  { id: 4, name: 'Bape Hoodie', price: '220', seller: '@streetwearking', condition: 'Like New', image: '/assets/products/bapehoodie.jpg' },
  { id: 5, name: 'Vintage Band Tee', price: '45', seller: '@vintagefinds', condition: 'Used', image: '/assets/products/vintageband.jpg' },
  { id: 6, name: 'Levis 501 Jeans', price: '75', seller: '@denimhead', condition: 'Used', image: '/assets/products/levis.jpg' },
  { id: 7, name: 'Champion Sweatshirt', price: '35', seller: '@thriftmaster', condition: 'Used', image: '/assets/products/championsweatshirt.jpg' },
  { id: 8, name: 'Nike Tech Fleece', price: '85', seller: '@sportswear', condition: 'Like New', image: '/assets/products/niketechfleece.jpg' },
]

export default function FavoritesCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null)

  function scroll(direction: 'left' | 'right') {
    scrollRef.current?.scrollBy({
      left: direction === 'left' ? -300 : 300,
      behavior: 'smooth',
    })
  }

  return (
    <section>
      <h2 className="font-martian text-[1.75rem] my-8 mb-6">24h Favorites</h2>
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
          {products.map((product) => (
            <div
              key={product.id}
              className="flex-[0_0_280px] cursor-pointer transition-transform duration-200 [scroll-snap-align:start]"
            >
              <div className="aspect-square overflow-hidden rounded-2xl bg-surface-light">
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-full w-full object-cover object-center"
                />
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-martian text-sm">{product.name}</h3>
                  <Icon icon="mdi:heart-outline" width={20} height={20} />
                </div>
                <p className="mt-1 font-martian text-sm text-text-muted">{product.seller}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-martian text-lg">${product.price}</span>
                  <span className="rounded-full bg-surface-light px-3 py-1 font-martian text-xs">{product.condition}</span>
                </div>
              </div>
            </div>
          ))}
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
