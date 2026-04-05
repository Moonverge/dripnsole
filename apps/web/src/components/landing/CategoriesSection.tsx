import { Icon } from '@iconify/react'

const categories = [
  { name: 'Men', icon: 'mdi:human-male', itemCount: '2.5k listings' },
  { name: 'Women', icon: 'mdi:human-female', itemCount: '3.1k listings' },
  { name: 'Vintage', icon: 'mdi:tshirt-crew', itemCount: '1.2k listings' },
  { name: 'Luxury', icon: 'mdi:diamond-stone', itemCount: '500+ items' },
]

export default function CategoriesSection() {
  return (
    <section>
      <h2 className="font-martian text-[1.75rem] my-8 mb-6">Browse Categories</h2>
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {categories.map((category) => (
          <div
            key={category.name}
            className="cursor-pointer rounded-2xl bg-black p-6 text-white transition-transform duration-200 hover:-translate-y-1"
          >
            <div className="mb-3 text-[2rem]">
              <Icon icon={category.icon} width={32} height={32} />
            </div>
            <h3 className="mb-2 font-martian text-xl">{category.name}</h3>
            <span className="font-martian text-sm text-text-faint">{category.itemCount}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
