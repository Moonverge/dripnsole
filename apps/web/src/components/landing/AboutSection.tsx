export default function AboutSection() {
  return (
    <section className="bg-black p-[clamp(1rem,3vw,2rem)] text-white max-md:pt-32">
      <div className="mx-auto grid max-w-[1200px] gap-[clamp(1rem,4vw,2rem)]">
        <div className="grid grid-cols-2 gap-8 p-[clamp(1rem,3vw,2rem)] max-md:-mt-48 max-md:grid-cols-1 max-md:[grid-template-areas:'image'_'content']">
          <img
            src="/assets/seller.jpg"
            alt="Spotlighting Top Social Sellers"
            className="h-[600px] w-full rounded-[2rem] object-cover max-md:h-[clamp(300px,50vw,400px)] max-md:[grid-area:image]"
          />
          <div className="flex flex-col justify-center max-md:relative max-md:z-[1] max-md:-mt-12 max-md:rounded-2xl max-md:p-8 max-md:text-center max-md:[grid-area:content]">
            <h2 className="mb-4 font-goblin text-[clamp(1.25rem,3vw,1.75rem)] font-bold">
              Spotlighting Top Social Sellers
            </h2>
            <p className="font-martian text-[clamp(1rem,2vw,1.125rem)] leading-relaxed text-text-faint">
              Meet the heroes of second-gear wheeling-dealing who are setting the pace in the world of used style.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 p-[clamp(1rem,3vw,2rem)] max-md:grid-cols-1 max-md:[grid-template-areas:'image'_'content']">
          <div className="flex flex-col justify-center max-md:relative max-md:z-[1] max-md:-mt-12 max-md:rounded-2xl max-md:p-8 max-md:text-center max-md:[grid-area:content]">
            <h2 className="mb-4 font-goblin text-[clamp(1.25rem,3vw,1.75rem)] font-bold">
              Item Showcase Extravaganza
            </h2>
            <p className="font-martian text-[clamp(1rem,2vw,1.125rem)] leading-relaxed text-text-faint">
              Dive into a pool of freshly-stocked items and pick out your favorites.
            </p>
          </div>
          <img
            src="/assets/showcase.jpg"
            alt="Item Showcase Extravaganza"
            className="h-[600px] w-full rounded-[2rem] object-cover max-md:h-[clamp(300px,50vw,400px)] max-md:[grid-area:image]"
          />
        </div>
      </div>
    </section>
  )
}
