import bcrypt from 'bcrypt'
import { randomUUID } from 'node:crypto'
import { eq, sql } from 'drizzle-orm'
import type { Db } from '../../src/db/client.js'
import {
  comments,
  conversations,
  follows,
  listingPhotos,
  listings,
  messages,
  offers,
  reservations,
  storeCategories,
  stores,
  transactions,
  users,
  notifications,
} from '../../src/db/schema.js'

export async function createUser(
  db: Db,
  overrides: {
    email?: string
    password?: string
    name?: string
    emailVerified?: boolean
  } = {},
) {
  const password = overrides.password ?? 'password12345'
  const passwordHash = await bcrypt.hash(password, 4)
  const [row] = await db
    .insert(users)
    .values({
      email: overrides.email ?? `u_${randomUUID()}@test.local`,
      passwordHash,
      name: overrides.name ?? 'Test User',
      emailVerified: overrides.emailVerified ?? false,
    })
    .returning()
  if (!row) throw new Error('createUser failed')
  return { user: row, plainPassword: password }
}

export async function createVerifiedUser(db: Db, overrides: Parameters<typeof createUser>[1] = {}) {
  return createUser(db, { ...overrides, emailVerified: true })
}

export async function createStore(
  db: Db,
  userId: string,
  overrides: { handle?: string; name?: string } = {},
) {
  const handle = overrides.handle ?? `store_${randomUUID().toString().slice(0, 8)}`
  const [store] = await db
    .insert(stores)
    .values({
      userId,
      handle,
      name: overrides.name ?? 'Test Store',
    })
    .returning()
  if (!store) throw new Error('createStore failed')
  await db.insert(storeCategories).values({ storeId: store.id, category: 'Tops' })
  return store
}

export async function createListing(
  db: Db,
  storeId: string,
  overrides: Partial<typeof listings.$inferInsert> = {},
) {
  const [listing] = await db
    .insert(listings)
    .values({
      storeId,
      title: overrides.title ?? 'Test Listing',
      category: overrides.category ?? 'Clothes',
      subcategory: overrides.subcategory ?? 'tees',
      condition: overrides.condition ?? 'BNWT',
      size: overrides.size ?? 'M',
      price: overrides.price ?? 1000,
      negotiable: overrides.negotiable ?? false,
      shippingOptions: overrides.shippingOptions ?? ['meetup'],
      description: overrides.description ?? 'Nice item',
      availability: overrides.availability ?? 'available',
    })
    .returning()
  if (!listing) throw new Error('createListing failed')
  return listing
}

export async function createPendingPhoto(db: Db, uploadedBy: string, order = 0) {
  const [p] = await db
    .insert(listingPhotos)
    .values({
      listingId: null,
      uploadedBy,
      url: `https://cdn.example.com/${randomUUID()}.webp`,
      slot: 'front',
      order,
    })
    .returning()
  if (!p) throw new Error('createPendingPhoto failed')
  return p
}

export async function markUserSeller(db: Db, userId: string) {
  await db.update(users).set({ isSeller: true }).where(eq(users.id, userId))
}

export async function createOfferRecord(
  db: Db,
  input: {
    listingId: string
    buyerId: string
    sellerId: string
    amount: number
    status?: typeof offers.$inferInsert.status
  },
) {
  const [o] = await db
    .insert(offers)
    .values({
      listingId: input.listingId,
      buyerId: input.buyerId,
      sellerId: input.sellerId,
      amount: input.amount,
      status: input.status ?? 'pending',
    })
    .returning()
  if (!o) throw new Error('createOfferRecord failed')
  return o
}

export async function createReservationRecord(
  db: Db,
  input: { listingId: string; buyerId: string; expiresAt: Date; status?: 'pending' | 'confirmed' },
) {
  const [r] = await db
    .insert(reservations)
    .values({
      listingId: input.listingId,
      buyerId: input.buyerId,
      status: input.status ?? 'pending',
      expiresAt: input.expiresAt,
    })
    .returning()
  if (!r) throw new Error('createReservationRecord failed')
  return r
}

export async function createTransaction(
  db: Db,
  input: { listingId: string; buyerId: string; sellerId: string },
) {
  const [t] = await db
    .insert(transactions)
    .values({
      listingId: input.listingId,
      buyerId: input.buyerId,
      sellerId: input.sellerId,
      completedAt: new Date(),
    })
    .returning()
  if (!t) throw new Error('createTransaction failed')
  return t
}

export async function createNotificationForUser(
  db: Db,
  userId: string,
  overrides: Partial<typeof notifications.$inferInsert> = {},
) {
  const [n] = await db
    .insert(notifications)
    .values({
      userId,
      type: overrides.type ?? 'new_comment',
      title: overrides.title ?? 'Hi',
      body: overrides.body ?? 'Body',
      linkTo: overrides.linkTo ?? '/x',
      read: overrides.read ?? false,
    })
    .returning()
  if (!n) throw new Error('createNotificationForUser failed')
  return n
}

export async function createConversationRecord(
  db: Db,
  input: { listingId: string; buyerId: string; sellerId: string },
) {
  const [c] = await db
    .insert(conversations)
    .values({
      listingId: input.listingId,
      buyerId: input.buyerId,
      sellerId: input.sellerId,
      lastMessageAt: new Date(),
    })
    .returning()
  if (!c) throw new Error('createConversationRecord failed')
  return c
}

export async function createMessage(
  db: Db,
  input: { conversationId: string; senderId: string; content: string },
) {
  const [m] = await db
    .insert(messages)
    .values({
      conversationId: input.conversationId,
      senderId: input.senderId,
      content: input.content,
    })
    .returning()
  if (!m) throw new Error('createMessage failed')
  return m
}

export async function createCommentRecord(
  db: Db,
  input: { listingId: string; userId: string; content: string; parentId?: string | null },
) {
  const [c] = await db
    .insert(comments)
    .values({
      listingId: input.listingId,
      userId: input.userId,
      parentId: input.parentId ?? null,
      content: input.content,
    })
    .returning()
  if (!c) throw new Error('createCommentRecord failed')
  return c
}

export async function followStore(db: Db, followerId: string, storeId: string) {
  await db.insert(follows).values({ followerId, storeId })
  await db
    .update(stores)
    .set({ followerCount: sql`${stores.followerCount} + 1` })
    .where(eq(stores.id, storeId))
}

export async function attachPhotoToListing(db: Db, listingId: string, photoId: string) {
  await db.update(listingPhotos).set({ listingId, order: 0 }).where(eq(listingPhotos.id, photoId))
}

export async function createListingWithAttachedPhoto(
  db: Db,
  storeId: string,
  uploadedByUserId: string,
  overrides: Partial<typeof listings.$inferInsert> = {},
) {
  const listing = await createListing(db, storeId, overrides)
  const photo = await createPendingPhoto(db, uploadedByUserId)
  await attachPhotoToListing(db, listing.id, photo.id)
  return { listing, photo }
}
