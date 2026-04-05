export default function HowItWorks() {
  return (
    <section className="mt-[1%] flex min-h-[80vh] w-full flex-col overflow-x-hidden bg-white p-[clamp(1rem,3vw,2rem)]">
      <h2 className="ml-[10%] w-[80%] pb-[clamp(3rem,2vw,10rem)] text-left font-goblin text-[clamp(2rem,5vw,3rem)] font-bold max-[480px]:ml-[5%] max-[480px]:w-[90%] max-[480px]:pb-12 max-md:ml-0 max-md:w-full max-md:text-center">
        How DripNSole Works
      </h2>

      <div className="relative ml-[10%] grid w-[80%] grid-cols-[repeat(2.5,1fr)] gap-8 max-md:mx-auto max-md:w-full max-md:grid-cols-1 max-md:text-center">
        <div className="col-start-1 row-start-1 max-md:col-start-1 max-md:mx-auto max-md:py-4">
          <h3 className="mb-2 font-martian text-[clamp(1.25rem,2.5vw,1.5rem)] font-bold">
            List Your Items
          </h3>
          <p className="max-w-[300px] font-martian text-[clamp(1rem,2vw,1.125rem)] text-text-secondary max-md:mx-auto max-md:max-w-full">
            Upload your products with a tag, and you're good to go!
          </p>
        </div>

        <div className="col-start-1 row-start-2 pt-28 max-md:col-start-1 max-md:row-start-2 max-md:mx-auto max-md:pt-8 max-md:py-4">
          <h3 className="mb-2 font-martian text-[clamp(1.25rem,2.5vw,1.5rem)] font-bold">
            Connect Your Profile
          </h3>
          <p className="max-w-[300px] font-martian text-[clamp(1rem,2vw,1.125rem)] text-text-secondary max-md:mx-auto max-md:max-w-full">
            Link your social media accounts for that delicious credibility factor.
          </p>
        </div>

        <div className="col-start-2 row-start-1 ml-32 max-md:col-start-1 max-md:row-start-3 max-md:mx-auto max-md:ml-0 max-md:py-4">
          <h3 className="mb-2 font-martian text-[clamp(1.25rem,2.5vw,1.5rem)] font-bold">
            Reach Buyers
          </h3>
          <p className="max-w-[300px] font-martian text-[clamp(1rem,2vw,1.125rem)] text-text-secondary max-md:mx-auto max-md:max-w-full">
            Let DripNSole be your loudspeaker to fashion-conscious buyers.
          </p>
        </div>
      </div>
    </section>
  )
}
