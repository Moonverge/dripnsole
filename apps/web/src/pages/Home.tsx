import { useEffect } from 'react'
import { useAuthStore } from '@/stores/auth.store'
import { useListingStore } from '@/stores/listing.store'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import HeroSection from '@/components/landing/HeroSection'
import LiveFeedStrip from '@/components/landing/LiveFeedStrip'
import FreshDropsCarousel from '@/components/landing/FavoritesCarousel'
import CategoriesSection from '@/components/landing/CategoriesSection'
import PricePointsSection from '@/components/landing/PricePointsSection'
import SocialProof from '@/components/landing/SocialProof'
import AboutSection from '@/components/landing/AboutSection'
import HowItWorks from '@/components/landing/HowItWorks'
import ListingCard from '@/components/listing/ListingCard'

function AuthenticatedFeed() {
  const { feedListings, fetchFeed, isLoading } = useListingStore()

  useEffect(() => {
    fetchFeed()
  }, [fetchFeed])

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-6">
      <h1 className="mb-6 font-goblin text-2xl font-bold md:text-3xl">Drip Feed</h1>
      {isLoading ? (
        <div className="flex min-h-[40vh] items-center justify-center font-martian text-sm text-text-muted">Loading your feed...</div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {feedListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function Home() {
  const user = useAuthStore((s) => s.user)

  if (user) {
    return <AuthenticatedFeed />
  }

  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <LiveFeedStrip />
        <div className="mx-auto mb-20 max-w-[1280px] px-4">
          <FreshDropsCarousel />
          <CategoriesSection />
          <PricePointsSection />
        </div>
        <HowItWorks />
        <SocialProof />
        <AboutSection />
      </main>
      <Footer />
    </>
  )
}
