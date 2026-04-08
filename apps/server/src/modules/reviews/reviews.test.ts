import { describe, expect, it, beforeEach } from 'vitest'
import {
  integrationContext,
  resetDatabase,
  protectedHeaders,
} from '../../../tests/helpers/integration-context.js'
import {
  createVerifiedUser,
  createListingWithAttachedPhoto,
  createTransaction,
} from '../../../tests/helpers/seed.js'
import { loginAs, loginVerifiedSeller } from '../../../tests/helpers/session.js'

describe('reviews module', () => {
  beforeEach(resetDatabase)

  it('POST /api/reviews/ — buyer with transaction returns 200', async () => {
    const { app } = await integrationContext()
    const db = app.deps.db
    const { token, userId, storeId } = await loginVerifiedSeller(app, db)
    const { listing } = await createListingWithAttachedPhoto(db, storeId, userId)
    const { user: buyer, plainPassword } = await createVerifiedUser(db)
    const tx = await createTransaction(db, {
      listingId: listing.id,
      buyerId: buyer.id,
      sellerId: userId,
    })
    const { accessToken } = await loginAs(app, buyer.email, plainPassword)
    const res = await app.inject({
      method: 'POST',
      url: '/api/reviews/',
      headers: protectedHeaders(accessToken),
      payload: { transaction_id: tx.id, rating: 5, comment: 'great' },
    })
    expect(res.statusCode).toBe(200)
    void token
  })
})
