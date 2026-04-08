import { Link } from 'react-router-dom'

export default function HeroSection() {
  return (
    <div className="relative flex min-h-[30vh] flex-col items-center justify-center p-[clamp(1rem,3vw,2rem)] max-md:min-h-[70vh] max-md:justify-start max-md:pt-12">
      <div className="absolute inset-0 -z-1 bg-[url('/assets/main.jpg')] bg-cover bg-center opacity-40" />
      <h1
        data-testid="home-title"
        className="text-center font-goblin text-[clamp(3.5rem,10vw,8rem)] font-bold uppercase max-md:mb-4 max-md:text-[clamp(2.5rem,8vw,3.5rem)]"
      >
        DripNSole
      </h1>
      <p
        data-testid="home-blurb"
        className="mx-auto mb-8 max-w-xl text-center font-martian text-[clamp(0.75rem,1.5vw,0.9rem)] leading-relaxed text-text-secondary"
      >
        The thrift store for PH sneakers and clothes — with 3D item views and one-tap FB & IG
        posting.
      </p>
      <div className="flex flex-row-reverse flex-wrap justify-center gap-4 max-[480px]:w-full max-[480px]:max-w-[300px] max-[480px]:flex-col">
        <Link
          to="/explore"
          className="rounded-full bg-accent-green px-10 py-4 text-center font-martian text-[clamp(0.875rem,2vw,1rem)] font-medium text-white no-underline transition-colors duration-300 hover:bg-[#0d9668] max-[480px]:w-full"
        >
          Shop Thrift Finds
        </Link>
        <Link
          to="/signup"
          className="rounded-full border-2 border-white bg-transparent px-10 py-4 text-center font-martian text-[clamp(0.875rem,2vw,1rem)] font-medium text-white no-underline transition-colors duration-300 hover:bg-white hover:text-black max-[480px]:w-full"
        >
          Start Selling Free
        </Link>
      </div>
    </div>
  )
}
