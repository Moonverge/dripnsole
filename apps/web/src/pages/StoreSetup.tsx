import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { useStoreStore } from '@/stores/store.store'
import { useAuthStore } from '@/stores/auth.store'
import type { StoreCategory } from '@/types/store'

const ALL_CATEGORIES: StoreCategory[] = [
  'Tops',
  'Bottoms',
  'Shoes',
  'Bags',
  'Accessories',
  'Vintage',
  'Luxury',
]

export default function StoreSetup() {
  const navigate = useNavigate()
  const { createStore, checkHandleAvailability, connectSocial, isLoading } = useStoreStore()
  const { becomeSeller } = useAuthStore()
  const [step, setStep] = useState(1)

  const [handle, setHandle] = useState('')
  const [handleAvailable, setHandleAvailable] = useState<boolean | null>(null)
  const [handleChecking, setHandleChecking] = useState(false)

  const [storeName, setStoreName] = useState('')
  const [bio, setBio] = useState('')
  const [banner, setBanner] = useState<File | null>(null)
  const [bannerPreview, setBannerPreview] = useState('')
  const [categories, setCategories] = useState<StoreCategory[]>([])
  const [pickupInfo, setPickupInfo] = useState('')
  const [shippingInfo, setShippingInfo] = useState('')

  const [fbConnected, setFbConnected] = useState(false)
  const [igConnected, setIgConnected] = useState(false)

  async function checkHandle(value: string) {
    setHandle(value)
    setHandleAvailable(null)
    if (value.length < 3) return
    setHandleChecking(true)
    const available = await checkHandleAvailability(value)
    setHandleAvailable(available)
    setHandleChecking(false)
  }

  function toggleCategory(cat: StoreCategory) {
    setCategories((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]))
  }

  function handleBannerUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setBanner(file)
      setBannerPreview(URL.createObjectURL(file))
    }
  }

  async function handleFinish() {
    await createStore({
      handle,
      name: storeName,
      bio,
      banner: banner || undefined,
      categories,
      pickupInfo,
      shippingInfo,
    })
    becomeSeller()
    setStep(4)
  }

  async function handleConnectFb() {
    await connectSocial('facebook')
    setFbConnected(true)
  }

  async function handleConnectIg() {
    await connectSocial('instagram')
    setIgConnected(true)
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8 md:py-16">
      <div className="mb-8 flex items-center justify-center gap-2">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`h-2 rounded-full transition-all ${s === step ? 'w-8 bg-brand' : s < step ? 'w-8 bg-black' : 'w-8 bg-border'}`}
          />
        ))}
      </div>

      {step === 1 && (
        <div>
          <h1 className="mb-2 font-goblin text-2xl font-bold md:text-3xl">Choose Your Handle</h1>
          <p className="mb-6 font-martian text-sm text-text-muted">
            This is your store's unique URL on DripNSole.
          </p>

          <div className="mb-4">
            <label className="mb-1.5 block font-martian text-xs font-medium text-text-secondary">
              Store Handle
            </label>
            <div className="flex items-center gap-2 rounded-lg border border-border px-4 py-3">
              <span className="font-martian text-sm text-text-muted">@</span>
              <input
                type="text"
                value={handle}
                onChange={(e) => checkHandle(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                className="flex-1 border-none font-martian text-sm outline-none"
                placeholder="YourStoreName"
              />
              {handleChecking && <Icon icon="mdi:loading" className="animate-spin" width={18} />}
              {handleAvailable === true && (
                <Icon icon="mdi:check-circle" className="text-accent-green" width={18} />
              )}
              {handleAvailable === false && (
                <Icon icon="mdi:close-circle" className="text-accent-red" width={18} />
              )}
            </div>
            {handle.length >= 3 && (
              <p className="mt-2 font-martian text-xs text-text-muted">
                dripnsole.ph/<span className="font-bold text-black">@{handle}</span>
              </p>
            )}
          </div>

          <button
            disabled={!handleAvailable}
            onClick={() => setStep(2)}
            className="w-full cursor-pointer rounded-full bg-brand py-3.5 font-martian text-sm font-medium text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
          >
            Continue
          </button>
        </div>
      )}

      {step === 2 && (
        <div>
          <h1 className="mb-2 font-goblin text-2xl font-bold md:text-3xl">Set Up Your Store</h1>
          <p className="mb-6 font-martian text-sm text-text-muted">Tell buyers about your store.</p>

          <div className="mb-4">
            <label className="mb-1.5 block font-martian text-xs font-medium text-text-secondary">
              Store Banner
            </label>
            <label className="flex h-40 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-border bg-surface-light transition-colors hover:border-brand">
              {bannerPreview ? (
                <img src={bannerPreview} alt="Banner" className="h-full w-full object-cover" />
              ) : (
                <div className="text-center">
                  <Icon
                    icon="mdi:image-plus-outline"
                    width={32}
                    className="mx-auto text-text-muted"
                  />
                  <p className="mt-1 font-martian text-xs text-text-muted">Upload banner</p>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleBannerUpload}
                className="hidden"
              />
            </label>
          </div>

          <div className="mb-4">
            <label className="mb-1.5 block font-martian text-xs font-medium text-text-secondary">
              Store Name
            </label>
            <input
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full rounded-lg border border-border px-4 py-3 font-martian text-sm focus:border-brand focus:outline-none"
              placeholder="Your Store Name"
            />
          </div>

          <div className="mb-4">
            <label className="mb-1.5 block font-martian text-xs font-medium text-text-secondary">
              Bio ({bio.length}/160)
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 160))}
              rows={3}
              className="w-full resize-none rounded-lg border border-border px-4 py-3 font-martian text-sm focus:border-brand focus:outline-none"
              placeholder="Describe your store..."
            />
          </div>

          <div className="mb-4">
            <label className="mb-1.5 block font-martian text-xs font-medium text-text-secondary">
              Categories You Sell
            </label>
            <div className="flex flex-wrap gap-2">
              {ALL_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={`cursor-pointer rounded-full px-4 py-2 font-martian text-xs transition-colors ${categories.includes(cat) ? 'bg-black text-white' : 'border border-border bg-white text-text-secondary hover:bg-surface-light'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="mb-1.5 block font-martian text-xs font-medium text-text-secondary">
              Pickup Info
            </label>
            <input
              value={pickupInfo}
              onChange={(e) => setPickupInfo(e.target.value)}
              className="w-full rounded-lg border border-border px-4 py-3 font-martian text-sm focus:border-brand focus:outline-none"
              placeholder="e.g. SM North EDSA meetup"
            />
          </div>

          <div className="mb-6">
            <label className="mb-1.5 block font-martian text-xs font-medium text-text-secondary">
              Shipping Info
            </label>
            <input
              value={shippingInfo}
              onChange={(e) => setShippingInfo(e.target.value)}
              className="w-full rounded-lg border border-border px-4 py-3 font-martian text-sm focus:border-brand focus:outline-none"
              placeholder="e.g. J&T Express, Lalamove"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="flex-1 cursor-pointer rounded-full border border-border bg-white py-3.5 font-martian text-sm font-medium transition-colors hover:bg-surface-light"
            >
              Back
            </button>
            <button
              disabled={!storeName || categories.length === 0}
              onClick={() => setStep(3)}
              className="flex-1 cursor-pointer rounded-full bg-brand py-3.5 font-martian text-sm font-medium text-white transition-colors hover:bg-black disabled:opacity-40"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <h1 className="mb-2 font-goblin text-2xl font-bold md:text-3xl">Connect Social</h1>
          <p className="mb-6 font-martian text-sm text-text-muted">
            Cross-post your drips to Facebook and Instagram. You can skip this and connect later.
          </p>

          <div className="mb-4 flex flex-col gap-3">
            <button
              onClick={handleConnectFb}
              disabled={fbConnected}
              className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border px-5 py-4 font-martian text-sm transition-colors ${fbConnected ? 'border-accent-green bg-green-50 text-accent-green' : 'border-border hover:bg-surface-light'}`}
            >
              <Icon
                icon="mdi:facebook"
                width={24}
                className={fbConnected ? 'text-accent-green' : 'text-[#1877F2]'}
              />
              {fbConnected ? 'Facebook Page Connected' : 'Connect Facebook Page'}
              {fbConnected && <Icon icon="mdi:check" width={20} className="ml-auto" />}
            </button>

            <button
              onClick={handleConnectIg}
              disabled={igConnected}
              className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border px-5 py-4 font-martian text-sm transition-colors ${igConnected ? 'border-accent-green bg-green-50 text-accent-green' : 'border-border hover:bg-surface-light'}`}
            >
              <Icon
                icon="mdi:instagram"
                width={24}
                className={igConnected ? 'text-accent-green' : 'text-[#E4405F]'}
              />
              {igConnected ? 'Instagram Connected' : 'Connect Instagram Business'}
              {igConnected && <Icon icon="mdi:check" width={20} className="ml-auto" />}
            </button>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(2)}
              className="flex-1 cursor-pointer rounded-full border border-border bg-white py-3.5 font-martian text-sm font-medium transition-colors hover:bg-surface-light"
            >
              Back
            </button>
            <button
              onClick={handleFinish}
              disabled={isLoading}
              className="flex-1 cursor-pointer rounded-full bg-brand py-3.5 font-martian text-sm font-medium text-white transition-colors hover:bg-black disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create Store'}
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="text-center">
          <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-accent-green/10">
            <Icon icon="mdi:check-circle" width={48} className="text-accent-green" />
          </div>
          <h1 className="mb-2 font-goblin text-3xl font-bold">Your Store is Live!</h1>
          <p className="mb-2 font-martian text-sm text-text-muted">
            dripnsole.ph/<span className="font-bold text-black">@{handle}</span>
          </p>
          <p className="mb-8 font-martian text-sm text-text-muted">
            Start listing your drips and reach buyers.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate('/dashboard/create')}
              className="w-full cursor-pointer rounded-full bg-brand py-3.5 font-martian text-sm font-medium text-white transition-colors hover:bg-black"
            >
              Create Your First Listing
            </button>
            <button
              onClick={() => navigate(`/store/${handle}`)}
              className="w-full cursor-pointer rounded-full border border-border bg-white py-3.5 font-martian text-sm font-medium transition-colors hover:bg-surface-light"
            >
              View Your Store
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
