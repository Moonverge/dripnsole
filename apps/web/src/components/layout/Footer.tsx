import { Link } from 'react-router-dom'
import { Icon } from '@iconify/react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="flex flex-col items-center border-t border-border-muted bg-surface p-8 font-sans text-[#333]">
      <div className="mx-8 my-12 mb-16 grid w-full max-w-[800px] grid-cols-3 gap-8 text-left max-md:grid-cols-1 max-md:text-center">
        <div>
          <p className="mb-2 font-bold">Shop</p>
          <ul className="m-0 list-none p-0">
            <li className="mb-2"><Link to="/explore" className="text-[#333] no-underline transition-colors duration-300 hover:text-accent-navy">Explore</Link></li>
            <li className="mb-2"><Link to="/explore?category=Shoes" className="text-[#333] no-underline transition-colors duration-300 hover:text-accent-navy">Shoes</Link></li>
            <li className="mb-2"><Link to="/explore?category=Clothes" className="text-[#333] no-underline transition-colors duration-300 hover:text-accent-navy">Clothes</Link></li>
            <li className="mb-2"><Link to="/explore?sort=most_saved" className="text-[#333] no-underline transition-colors duration-300 hover:text-accent-navy">Trending</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-2 font-bold">Sell</p>
          <ul className="m-0 list-none p-0">
            <li className="mb-2"><Link to="/signup" className="text-[#333] no-underline transition-colors duration-300 hover:text-accent-navy">Start Selling</Link></li>
            <li className="mb-2"><a href="#how-it-works" className="text-[#333] no-underline transition-colors duration-300 hover:text-accent-navy">How It Works</a></li>
            <li className="mb-2"><Link to="/login" className="text-[#333] no-underline transition-colors duration-300 hover:text-accent-navy">Dashboard</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-2 font-bold">Company</p>
          <ul className="m-0 list-none p-0">
            <li className="mb-2"><a href="#" className="text-[#333] no-underline transition-colors duration-300 hover:text-accent-navy">About</a></li>
            <li className="mb-2"><a href="#" className="text-[#333] no-underline transition-colors duration-300 hover:text-accent-navy">Privacy Policy</a></li>
            <li className="mb-2"><a href="#" className="text-[#333] no-underline transition-colors duration-300 hover:text-accent-navy">Terms of Service</a></li>
          </ul>
        </div>
      </div>
      <div className="text-center">
        <div className="mb-4 flex justify-center gap-4 text-2xl">
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-[#333] transition-colors duration-300 hover:text-accent-blue">
            <Icon icon="mdi:facebook" width={24} height={24} />
          </a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-[#333] transition-colors duration-300 hover:text-accent-blue">
            <Icon icon="mdi:instagram" width={24} height={24} />
          </a>
          <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="text-[#333] transition-colors duration-300 hover:text-accent-blue">
            <Icon icon="ic:baseline-tiktok" width={24} height={24} />
          </a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="text-[#333] transition-colors duration-300 hover:text-accent-blue">
            <Icon icon="mdi:twitter" width={24} height={24} />
          </a>
        </div>
        <p className="m-0">© DripNSole {currentYear}</p>
      </div>
    </footer>
  )
}
