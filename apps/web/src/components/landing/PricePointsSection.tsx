import { Icon } from '@iconify/react'

const priceRanges = [
  { name: 'Steals', icon: 'mdi:tag-multiple', range: 'Under $50', description: 'Amazing finds on a budget' },
  { name: 'Mid-Range', icon: 'mdi:cash', range: '$50 - $100', description: 'Quality everyday pieces' },
  { name: 'Premium', icon: 'mdi:star', range: '$100 - $200', description: 'High-end streetwear' },
  { name: 'Grails', icon: 'mdi:crown', range: '$200+', description: 'Rare & collectible items' },
]

export default function PricePointsSection() {
  return (
    <section>
      <h2 className="font-martian text-[1.75rem] my-8 mb-6">Price Points</h2>
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {priceRanges.map((range) => (
          <div
            key={range.name}
            className="cursor-pointer rounded-2xl bg-black p-6 text-white transition-transform duration-200 hover:-translate-y-1"
          >
            <div className="mb-3 text-[2rem]">
              <Icon icon={range.icon} width={32} height={32} />
            </div>
            <div>
              <h3 className="mb-2 font-martian text-xl">{range.name}</h3>
              <p className="mb-1 font-martian text-lg text-accent-green">{range.range}</p>
              <span className="font-martian text-sm text-text-faint">{range.description}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
