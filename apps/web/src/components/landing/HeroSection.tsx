export default function HeroSection() {
  return (
    <div className="relative flex min-h-[30vh] flex-col items-center justify-center p-[clamp(1rem,3vw,2rem)] max-md:min-h-[70vh] max-md:justify-start max-md:pt-12">
      <div className="absolute inset-0 -z-1 bg-[url('/assets/main.jpg')] bg-cover bg-center opacity-40" />
      <h1 className="text-center font-goblin text-[clamp(3.5rem,10vw,8rem)] font-bold uppercase max-md:mb-8 max-md:text-[clamp(2.5rem,8vw,3.5rem)]">
        DripNSole
      </h1>
      <div className="mt-8 flex flex-row-reverse flex-wrap justify-center gap-4 max-[480px]:w-full max-[480px]:max-w-[300px] max-[480px]:flex-col">
        <button className="cursor-pointer rounded-full bg-brand px-8 py-3 font-martian text-[clamp(0.875rem,2vw,1rem)] text-white transition-colors duration-300 hover:bg-black max-[480px]:w-full max-[480px]:text-center">
          Start Selling
        </button>
        <button className="cursor-pointer rounded-full bg-black px-8 py-3 font-martian text-[clamp(0.875rem,2vw,1rem)] text-white transition-colors duration-300 hover:bg-text-link max-[480px]:w-full max-[480px]:text-center">
          Discover Items
        </button>
      </div>
    </div>
  )
}
