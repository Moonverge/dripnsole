import type { Listing } from '@/types/listing'

const EMOJIS = ['🔥', '✨', '👀', '🛒']

function categoryHashtag(listing: Listing): string {
  const sub = listing.subcategory?.toLowerCase().replace(/[^a-z0-9]+/g, '') ?? ''
  if (sub) return `#${sub}`
  return `#${listing.category.toLowerCase()}`
}

export function generateCaption(listing: Listing, handle: string): string {
  const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)]
  const sizeLine = listing.size
    ? ` · Size ${listing.size}${listing.sizeUnit ? ' ' + listing.sizeUnit : ''}`
    : ''
  return [
    `${emoji} ${listing.title}`,
    `₱${listing.price.toLocaleString()} · ${listing.condition}${sizeLine}`,
    '',
    `Cop here → dripnsole.ph/@${handle}`,
    `#thriftph #ukayukay ${categoryHashtag(listing)} #dripnsole`,
  ].join('\n')
}
