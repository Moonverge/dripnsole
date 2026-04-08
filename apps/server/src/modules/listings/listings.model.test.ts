import { describe, expect, it } from 'vitest'
import { sortPhotosForDto, toListingDto } from './listings.model.js'

describe('listings.model', () => {
  it('toListingDto maps null size and description to defaults', () => {
    const createdAt = new Date('2024-01-02T03:04:05.000Z')
    const listing = {
      id: 'aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee',
      storeId: 'bbbbbbbb-bbbb-4ccc-dddd-eeeeeeeeeeee',
      title: 'T',
      category: 'Clothes',
      subcategory: 'S',
      condition: 'BNWT',
      size: null,
      sizeUnit: null,
      measurements: null,
      price: 10,
      negotiable: false,
      shippingOptions: ['ship'],
      description: null,
      availability: 'available' as const,
      viewCount: 1,
      saveCount: 0,
      commentCount: 0,
      createdAt,
      updatedAt: createdAt,
      deletedAt: null,
    } as never
    const storeRow = {
      id: 'bbbbbbbb-bbbb-4ccc-dddd-eeeeeeeeeeee',
      userId: 'cccccccc-cccc-4ccc-cccc-cccccccccccc',
      handle: 'h',
      name: 'Store',
      bio: null,
      bannerUrl: null,
      pickupInfo: null,
      shippingInfo: null,
      badge: null,
      rating: '0',
      reviewCount: 0,
      completedTransactions: 0,
      followerCount: 0,
      fbConnected: false,
      igConnected: false,
      createdAt,
      updatedAt: createdAt,
    } as never
    const dto = toListingDto(listing, storeRow, [])
    expect(dto.size).toBe('')
    expect(dto.description).toBe('')
    expect(dto.measurements).toEqual({})
    expect(dto.sizeUnit).toBeUndefined()
  })

  it('sortPhotosForDto orders by order field', () => {
    const sorted = sortPhotosForDto([
      { id: 'a', url: 'a', slot: 'm', order: 2 },
      { id: 'b', url: 'b', slot: 'm', order: 1 },
    ])
    expect(sorted.map((p) => p.id)).toEqual(['b', 'a'])
  })
})
