import { Icon } from '@iconify/react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="flex flex-col items-center border-t border-border-muted bg-surface p-8 font-sans text-[#333]">
      <div className="mx-8 my-12 mb-16 grid w-full max-w-[800px] grid-cols-3 gap-8 text-left max-md:grid-cols-1 max-md:text-center">
        <div>
          <p className="mb-2 font-bold">QuickLinks</p>
          <ul className="m-0 list-none p-0">
            <li className="mb-2"><a href="/about" className="text-[#333] no-underline transition-colors duration-300 hover:text-accent-navy">About</a></li>
            <li className="mb-2"><a href="/faq" className="text-[#333] no-underline transition-colors duration-300 hover:text-accent-navy">FAQ</a></li>
            <li className="mb-2"><a href="/support" className="text-[#333] no-underline transition-colors duration-300 hover:text-accent-navy">Support</a></li>
          </ul>
        </div>
        <div>
          <p className="mb-2 font-bold">Legal</p>
          <ul className="m-0 list-none p-0">
            <li className="mb-2"><a href="/privacy" className="text-[#333] no-underline transition-colors duration-300 hover:text-accent-navy">Privacy Policy</a></li>
            <li className="mb-2"><a href="/terms" className="text-[#333] no-underline transition-colors duration-300 hover:text-accent-navy">Terms of Service</a></li>
          </ul>
        </div>
        <div>
          <p className="mb-2 font-bold">Stay Connected</p>
          <ul className="m-0 list-none p-0">
            <li className="mb-2"><a href="/instagram" className="text-[#333] no-underline transition-colors duration-300 hover:text-accent-navy">Instagram</a></li>
            <li className="mb-2"><a href="/tiktok" className="text-[#333] no-underline transition-colors duration-300 hover:text-accent-navy">TikTok</a></li>
            <li className="mb-2"><a href="/twitter" className="text-[#333] no-underline transition-colors duration-300 hover:text-accent-navy">Twitter</a></li>
          </ul>
        </div>
      </div>
      <div className="text-center">
        <div className="mb-4 flex justify-center gap-4 text-2xl">
          <a href="/twitter" aria-label="Twitter" className="text-[#333] transition-colors duration-300 hover:text-accent-blue">
            <Icon icon="mdi:twitter" width={24} height={24} />
          </a>
          <a href="/instagram" aria-label="Instagram" className="text-[#333] transition-colors duration-300 hover:text-accent-blue">
            <Icon icon="mdi:instagram" width={24} height={24} />
          </a>
          <a href="/facebook" aria-label="Facebook" className="text-[#333] transition-colors duration-300 hover:text-accent-blue">
            <Icon icon="mdi:facebook" width={24} height={24} />
          </a>
          <a href="/tiktok" aria-label="TikTok" className="text-[#333] transition-colors duration-300 hover:text-accent-blue">
            <Icon icon="ic:baseline-tiktok" width={24} height={24} />
          </a>
        </div>
        <p className="m-0">© DripNSole {currentYear}</p>
      </div>
    </footer>
  )
}
