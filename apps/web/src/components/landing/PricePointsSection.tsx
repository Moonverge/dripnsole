import { Link } from 'react-router-dom'
import { Icon } from '@iconify/react'

const priceRanges = [
  { name: 'Steals', icon: 'mdi:tag-multiple', range: 'Under ₱500', description: 'Amazing finds on a budget', href: '/explore?priceMax=500' },
  { name: 'Mid-Range', icon: 'mdi:cash', range: '₱500 – ₱2,000', description: 'Quality everyday pieces', href: '/explore?priceMin=500&priceMax=2000' },
  { name: 'Premium', icon: 'mdi:star', range: '₱2,000 – ₱5,000', description: 'High-end streetwear', href: '/explore?priceMin=2000&priceMax=5000' },
  { name: 'Grails', icon: 'mdi:crown', range: '₱5,000+', description: 'Rare & collectible items', href: '/explore?priceMin=5000' },
]

export default function PricePointsSection() {
  return (
    <section>
      <h2 className="font-martian text-[1.75rem] my-8 mb-6">Price Points</h2>
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {priceRanges.map((range) => (
          <Link
            key={range.name}
            to={range.href}
            className="cursor-pointer rounded-2xl bg-black p-6 text-white no-underline transition-transform duration-200 hover:-translate-y-1"
          >
            <div className="mb-3 text-[2rem]">
              <Icon icon={range.icon} width={32} height={32} />
            </div>
            <div>
              <h3 className="mb-2 font-martian text-xl">{range.name}</h3>
              <p className="mb-1 font-martian text-lg text-accent-green">{range.range}</p>
              <span className="font-martian text-sm text-text-faint">{range.description}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
