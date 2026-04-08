import { describe, expect, it, vi } from 'vitest'
import { createReservationsService } from './reservations.service.js'
import type { ReservationsRepository } from './reservations.repository.js'

function repo(p: Partial<ReservationsRepository>): ReservationsRepository {
  return {
    listAsBuyer: vi.fn().mockResolvedValue([]),
    selectOwnedListingIdsForUser: vi.fn().mockResolvedValue([]),
    listAsSellerByListingIds: vi.fn().mockResolvedValue([]),
    findListingById: vi.fn(),
    findStoreById: vi.fn(),
    insertReservation: vi.fn(),
    setListingAvailability: vi.fn(),
    findReservationById: vi.fn(),
    updateReservationStatus: vi.fn(),
    ...p,
  } as unknown as ReservationsRepository
}

describe('createReservationsService', () => {
  it('listForUser dedupes reservations seen as buyer and seller', async () => {
    const shared = {
      id: '10000000-0000-4000-b000-000000000001',
      listingId: '20000000-0000-4000-b000-000000000002',
      buyerId: '30000000-0000-4000-b000-000000000003',
      status: 'pending' as const,
      expiresAt: new Date(),
      createdAt: new Date(),
    }
    const r = repo({
      listAsBuyer: vi.fn().mockResolvedValue([shared]),
      selectOwnedListingIdsForUser: vi.fn().mockResolvedValue([{ id: shared.listingId }]),
      listAsSellerByListingIds: vi.fn().mockResolvedValue([shared]),
    })
    const svc = createReservationsService(r)
    const out = await svc.listForUser('30000000-0000-4000-b000-000000000003')
    expect(out.reservations).toHaveLength(1)
  })

  it('create — bad listing id', async () => {
    const svc = createReservationsService(repo({}))
    const out = await svc.create('u', { listing_id: 'not-a-uuid' })
    expect(out.kind).toBe('bad_id')
  })

  it('create — listing not found', async () => {
    const svc = createReservationsService(repo({ findListingById: vi.fn().mockResolvedValue([]) }))
    const out = await svc.create('u', { listing_id: '10000000-0000-4000-b000-000000000001' })
    expect(out.kind).toBe('not_found')
  })

  it('create — listing deleted', async () => {
    const svc = createReservationsService(
      repo({
        findListingById: vi.fn().mockResolvedValue([
          {
            id: 'a',
            storeId: 's',
            availability: 'available',
            deletedAt: new Date(),
          },
        ]),
      }),
    )
    const out = await svc.create('u', { listing_id: '10000000-0000-4000-b000-000000000001' })
    expect(out.kind).toBe('not_found')
  })

  it('create — reserved listing is conflict', async () => {
    const svc = createReservationsService(
      repo({
        findListingById: vi.fn().mockResolvedValue([
          {
            id: 'a',
            storeId: 's',
            availability: 'reserved',
            deletedAt: null,
          },
        ]),
      }),
    )
    const out = await svc.create('u', { listing_id: '10000000-0000-4000-b000-000000000001' })
    expect(out.kind).toBe('conflict')
  })

  it('create — sold listing is invalid', async () => {
    const svc = createReservationsService(
      repo({
        findListingById: vi.fn().mockResolvedValue([
          {
            id: 'a',
            storeId: 's',
            availability: 'sold',
            deletedAt: null,
          },
        ]),
      }),
    )
    const out = await svc.create('u', { listing_id: '10000000-0000-4000-b000-000000000001' })
    expect(out.kind).toBe('invalid')
  })

  it('create — buyer owns store is invalid', async () => {
    const buyer = '30000000-0000-4000-b000-000000000003'
    const svc = createReservationsService(
      repo({
        findListingById: vi.fn().mockResolvedValue([
          {
            id: 'a',
            storeId: 's',
            availability: 'available',
            deletedAt: null,
          },
        ]),
        findStoreById: vi.fn().mockResolvedValue([{ userId: buyer }]),
      }),
    )
    const out = await svc.create(buyer, { listing_id: '10000000-0000-4000-b000-000000000001' })
    expect(out.kind).toBe('invalid')
  })

  it('create — unique violation is conflict', async () => {
    const err = Object.assign(new Error('dup'), { code: '23505' })
    const svc = createReservationsService(
      repo({
        findListingById: vi.fn().mockResolvedValue([
          {
            id: '10000000-0000-4000-b000-000000000001',
            storeId: 's',
            availability: 'available',
            deletedAt: null,
          },
        ]),
        findStoreById: vi.fn().mockResolvedValue([{ userId: 'seller-id' }]),
        insertReservation: vi.fn().mockRejectedValue(err),
      }),
    )
    const out = await svc.create('buyer-id', {
      listing_id: '10000000-0000-4000-b000-000000000001',
    })
    expect(out.kind).toBe('conflict')
  })

  it('create — nested unique violation cause is conflict', async () => {
    const err = { cause: { code: '23505' } }
    const svc = createReservationsService(
      repo({
        findListingById: vi.fn().mockResolvedValue([
          {
            id: '10000000-0000-4000-b000-000000000001',
            storeId: 's',
            availability: 'available',
            deletedAt: null,
          },
        ]),
        findStoreById: vi.fn().mockResolvedValue([{ userId: 'seller-id' }]),
        insertReservation: vi.fn().mockRejectedValue(err),
      }),
    )
    const out = await svc.create('buyer-id', {
      listing_id: '10000000-0000-4000-b000-000000000001',
    })
    expect(out.kind).toBe('conflict')
  })

  it('create — other db error is invalid', async () => {
    const svc = createReservationsService(
      repo({
        findListingById: vi.fn().mockResolvedValue([
          {
            id: '10000000-0000-4000-b000-000000000001',
            storeId: 's',
            availability: 'available',
            deletedAt: null,
          },
        ]),
        findStoreById: vi.fn().mockResolvedValue([{ userId: 'seller-id' }]),
        insertReservation: vi.fn().mockRejectedValue(new Error('other')),
      }),
    )
    const out = await svc.create('buyer-id', {
      listing_id: '10000000-0000-4000-b000-000000000001',
    })
    expect(out.kind).toBe('invalid')
  })

  it('patch — bad id', async () => {
    const svc = createReservationsService(repo({}))
    const out = await svc.patch('s', 'bad', { status: 'confirmed' })
    expect(out.kind).toBe('bad_id')
  })

  it('patch — not found', async () => {
    const svc = createReservationsService(
      repo({ findReservationById: vi.fn().mockResolvedValue([]) }),
    )
    const out = await svc.patch('s', '10000000-0000-4000-b000-000000000001', {
      status: 'confirmed',
    })
    expect(out.kind).toBe('not_found')
  })

  it('patch — forbidden when not listing seller', async () => {
    const resv = {
      id: 'r',
      listingId: 'l',
      buyerId: 'b',
      status: 'pending' as const,
      expiresAt: new Date(),
      createdAt: new Date(),
    }
    const svc = createReservationsService(
      repo({
        findReservationById: vi
          .fn()
          .mockResolvedValueOnce([resv])
          .mockResolvedValueOnce([{ ...resv, status: 'confirmed' as const }]),
        findListingById: vi
          .fn()
          .mockResolvedValue([
            { id: 'l', storeId: 'st', availability: 'reserved', deletedAt: null },
          ]),
        findStoreById: vi.fn().mockResolvedValue([{ userId: 'other-seller' }]),
        updateReservationStatus: vi.fn(),
        setListingAvailability: vi.fn(),
      }),
    )
    const out = await svc.patch('wrong-seller', '10000000-0000-4000-b000-000000000001', {
      status: 'confirmed',
    })
    expect(out.kind).toBe('forbidden')
  })

  it('patch — missing listing row still forbids', async () => {
    const resv = {
      id: 'r',
      listingId: 'l',
      buyerId: 'b',
      status: 'pending' as const,
      expiresAt: new Date(),
      createdAt: new Date(),
    }
    const svc = createReservationsService(
      repo({
        findReservationById: vi.fn().mockResolvedValueOnce([resv]).mockResolvedValueOnce([resv]),
        findListingById: vi.fn().mockResolvedValue([]),
        updateReservationStatus: vi.fn(),
        setListingAvailability: vi.fn(),
      }),
    )
    const out = await svc.patch('seller', '10000000-0000-4000-b000-000000000001', {
      status: 'confirmed',
    })
    expect(out.kind).toBe('forbidden')
  })

  it('patch — confirmed keeps listing reserved', async () => {
    const resv = {
      id: 'r',
      listingId: 'l',
      buyerId: 'b',
      status: 'pending' as const,
      expiresAt: new Date(),
      createdAt: new Date(),
    }
    const seller = '40000000-0000-4000-b000-000000000004'
    const updated = { ...resv, status: 'confirmed' as const }
    const svc = createReservationsService(
      repo({
        findReservationById: vi.fn().mockResolvedValueOnce([resv]).mockResolvedValueOnce([updated]),
        findListingById: vi
          .fn()
          .mockResolvedValue([
            { id: 'l', storeId: 'st', availability: 'reserved', deletedAt: null },
          ]),
        findStoreById: vi.fn().mockResolvedValue([{ userId: seller }]),
        updateReservationStatus: vi.fn(),
        setListingAvailability: vi.fn(),
      }),
    )
    const out = await svc.patch(seller, '10000000-0000-4000-b000-000000000001', {
      status: 'confirmed',
    })
    expect(out.kind).toBe('ok')
  })

  it('patch — expired frees listing', async () => {
    const resv = {
      id: 'r',
      listingId: 'l',
      buyerId: 'b',
      status: 'pending' as const,
      expiresAt: new Date(),
      createdAt: new Date(),
    }
    const seller = '40000000-0000-4000-b000-000000000004'
    const updated = { ...resv, status: 'expired' as const }
    const setAv = vi.fn()
    const svc = createReservationsService(
      repo({
        findReservationById: vi.fn().mockResolvedValueOnce([resv]).mockResolvedValueOnce([updated]),
        findListingById: vi
          .fn()
          .mockResolvedValue([
            { id: 'l', storeId: 'st', availability: 'reserved', deletedAt: null },
          ]),
        findStoreById: vi.fn().mockResolvedValue([{ userId: seller }]),
        updateReservationStatus: vi.fn(),
        setListingAvailability: setAv,
      }),
    )
    const out = await svc.patch(seller, '10000000-0000-4000-b000-000000000001', {
      status: 'expired',
    })
    expect(out.kind).toBe('ok')
    expect(setAv).toHaveBeenCalledWith('l', 'available')
  })
})
