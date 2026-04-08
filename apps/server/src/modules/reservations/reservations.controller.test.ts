import { describe, expect, it, vi } from 'vitest'
import { createReservationsController } from './reservations.controller.js'
import type { ReservationsService } from './reservations.service.js'

function mockReply() {
  const status = vi.fn().mockReturnThis()
  const send = vi.fn().mockReturnThis()
  return { status, send }
}

describe('createReservationsController', () => {
  it('list sends success payload', async () => {
    const service = {
      listForUser: vi.fn().mockResolvedValue({ reservations: [{ id: 'r' }] }),
    } as unknown as ReservationsService
    const c = createReservationsController(service)
    const reply = mockReply()
    await c.list({ userId: 'u1' } as never, reply as never)
    expect(service.listForUser).toHaveBeenCalledWith('u1')
    expect(reply.send).toHaveBeenCalledWith({
      success: true,
      data: { reservations: [{ id: 'r' }] },
    })
  })

  it('create — validation failure', async () => {
    const c = createReservationsController({} as ReservationsService)
    const reply = mockReply()
    await c.create({ body: {}, userId: 'u' } as never, reply as never)
    expect(reply.status).toHaveBeenCalledWith(400)
  })

  it('create — bad_id', async () => {
    const service = {
      create: vi.fn().mockResolvedValue({ kind: 'bad_id' as const }),
    } as unknown as ReservationsService
    const c = createReservationsController(service)
    const reply = mockReply()
    await c.create(
      {
        body: { listing_id: '10000000-0000-4000-b000-000000000001' },
        userId: 'u',
      } as never,
      reply as never,
    )
    expect(reply.status).toHaveBeenCalledWith(400)
  })

  it('create — not_found', async () => {
    const service = {
      create: vi.fn().mockResolvedValue({ kind: 'not_found' as const }),
    } as unknown as ReservationsService
    const c = createReservationsController(service)
    const reply = mockReply()
    await c.create(
      {
        body: { listing_id: '10000000-0000-4000-b000-000000000001' },
        userId: 'u',
      } as never,
      reply as never,
    )
    expect(reply.status).toHaveBeenCalledWith(404)
  })

  it('create — invalid', async () => {
    const service = {
      create: vi.fn().mockResolvedValue({ kind: 'invalid' as const }),
    } as unknown as ReservationsService
    const c = createReservationsController(service)
    const reply = mockReply()
    await c.create(
      {
        body: { listing_id: '10000000-0000-4000-b000-000000000001' },
        userId: 'u',
      } as never,
      reply as never,
    )
    expect(reply.status).toHaveBeenCalledWith(400)
  })

  it('create — conflict', async () => {
    const service = {
      create: vi.fn().mockResolvedValue({ kind: 'conflict' as const }),
    } as unknown as ReservationsService
    const c = createReservationsController(service)
    const reply = mockReply()
    await c.create(
      {
        body: { listing_id: '10000000-0000-4000-b000-000000000001' },
        userId: 'u',
      } as never,
      reply as never,
    )
    expect(reply.status).toHaveBeenCalledWith(409)
  })

  it('create — ok returns 201', async () => {
    const resv = { id: 'r', listingId: 'l', buyerId: 'b', status: 'pending' as const }
    const service = {
      create: vi.fn().mockResolvedValue({ kind: 'ok' as const, reservation: resv }),
    } as unknown as ReservationsService
    const c = createReservationsController(service)
    const reply = mockReply()
    await c.create(
      {
        body: { listing_id: '10000000-0000-4000-b000-000000000001' },
        userId: 'u',
      } as never,
      reply as never,
    )
    expect(reply.status).toHaveBeenCalledWith(201)
  })

  it('patch — validation failure', async () => {
    const c = createReservationsController({} as ReservationsService)
    const reply = mockReply()
    await c.patch(
      { body: { status: 'pending' }, params: { id: 'x' }, userId: 'u' } as never,
      reply as never,
    )
    expect(reply.status).toHaveBeenCalledWith(400)
  })

  it('patch — bad_id', async () => {
    const service = {
      patch: vi.fn().mockResolvedValue({ kind: 'bad_id' as const }),
    } as unknown as ReservationsService
    const c = createReservationsController(service)
    const reply = mockReply()
    await c.patch(
      {
        body: { status: 'confirmed' },
        params: { id: '10000000-0000-4000-b000-000000000001' },
        userId: 'u',
      } as never,
      reply as never,
    )
    expect(reply.status).toHaveBeenCalledWith(400)
  })

  it('patch — not_found', async () => {
    const service = {
      patch: vi.fn().mockResolvedValue({ kind: 'not_found' as const }),
    } as unknown as ReservationsService
    const c = createReservationsController(service)
    const reply = mockReply()
    await c.patch(
      {
        body: { status: 'confirmed' },
        params: { id: '10000000-0000-4000-b000-000000000001' },
        userId: 'u',
      } as never,
      reply as never,
    )
    expect(reply.status).toHaveBeenCalledWith(404)
  })

  it('patch — forbidden', async () => {
    const service = {
      patch: vi.fn().mockResolvedValue({ kind: 'forbidden' as const }),
    } as unknown as ReservationsService
    const c = createReservationsController(service)
    const reply = mockReply()
    await c.patch(
      {
        body: { status: 'confirmed' },
        params: { id: '10000000-0000-4000-b000-000000000001' },
        userId: 'u',
      } as never,
      reply as never,
    )
    expect(reply.status).toHaveBeenCalledWith(403)
  })

  it('patch — ok', async () => {
    const resv = { id: 'r', listingId: 'l', buyerId: 'b', status: 'confirmed' as const }
    const service = {
      patch: vi.fn().mockResolvedValue({ kind: 'ok' as const, reservation: resv }),
    } as unknown as ReservationsService
    const c = createReservationsController(service)
    const reply = mockReply()
    await c.patch(
      {
        body: { status: 'confirmed' },
        params: { id: '10000000-0000-4000-b000-000000000001' },
        userId: 'u',
      } as never,
      reply as never,
    )
    expect(reply.send).toHaveBeenCalledWith({ success: true, data: { reservation: resv } })
  })
})
