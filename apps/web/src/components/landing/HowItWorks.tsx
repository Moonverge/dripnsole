import { useState } from 'react'

const BUYER_STEPS = [
  {
    title: 'Browse Thousands of Thrift Finds',
    description:
      'Explore drips across sneakers, clothes, vintage, and luxury — all from Filipino sellers.',
  },
  {
    title: 'Spin the Item in 3D',
    description:
      'Drag to rotate. See every angle. Then tap "Real Photos" for close-ups on condition and defects.',
  },
  {
    title: 'DM, Offer, Reserve & Pay',
    description:
      'Message the seller, make an offer in PHP, reserve the item, and arrange shipping or meetup via GCash or COD.',
  },
]

const SELLER_STEPS = [
  {
    title: 'Create Your Free Store in 2 Minutes',
    description:
      'Pick a handle, upload a banner, write a bio. Your store goes live at dripnsole.ph/@yourname.',
  },
  {
    title: 'Upload Photos — We Generate the Spin View',
    description:
      'Follow the guided shot list. We stitch your photos into a drag-to-rotate 3D preview automatically.',
  },
  {
    title: 'Post to Facebook & Instagram in One Tap',
    description:
      'Auto-generated captions with hashtags. Select listings, pick platforms, hit post. Done.',
  },
]

export default function HowItWorks() {
  const [role, setRole] = useState<'buyer' | 'seller'>('buyer')
  const steps = role === 'buyer' ? BUYER_STEPS : SELLER_STEPS

  return (
    <section
      id="how-it-works"
      className="mt-[1%] flex min-h-[80vh] w-full flex-col overflow-x-hidden bg-white p-[clamp(1rem,3vw,2rem)]"
    >
      <h2 className="ml-[10%] w-[80%] pb-8 text-left font-goblin text-[clamp(2rem,5vw,3rem)] font-bold max-[480px]:ml-[5%] max-[480px]:w-[90%] max-md:ml-0 max-md:w-full max-md:text-center">
        How DripNSole Works
      </h2>

      <div className="mx-auto mb-10 flex rounded-full border border-border p-1 max-md:mx-auto">
        <button
          onClick={() => setRole('buyer')}
          className={`cursor-pointer rounded-full px-6 py-2.5 font-martian text-sm transition-colors ${role === 'buyer' ? 'bg-black text-white' : 'bg-none text-text-secondary hover:bg-surface-light'}`}
        >
          I'm a Buyer
        </button>
        <button
          onClick={() => setRole('seller')}
          className={`cursor-pointer rounded-full px-6 py-2.5 font-martian text-sm transition-colors ${role === 'seller' ? 'bg-black text-white' : 'bg-none text-text-secondary hover:bg-surface-light'}`}
        >
          I'm a Seller
        </button>
      </div>

      <div className="relative mx-auto grid w-[80%] grid-cols-1 gap-8 md:grid-cols-3 max-md:w-full max-md:text-center">
        {steps.map((step, i) => (
          <div key={`${role}-${i}`} className="animate-[fadeIn_0.4s_ease-out]">
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand font-martian text-sm font-bold text-white">
              {i + 1}
            </div>
            <h3 className="mb-2 font-martian text-[clamp(1.1rem,2vw,1.3rem)] font-bold">
              {step.title}
            </h3>
            <p className="max-w-[340px] font-martian text-[clamp(0.875rem,1.5vw,1rem)] leading-relaxed text-text-secondary max-md:mx-auto max-md:max-w-full">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
