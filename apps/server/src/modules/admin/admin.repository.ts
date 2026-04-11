import { and, count, desc, eq, gte, ilike, isNull, or } from 'drizzle-orm'
import type { Db } from '../../db/client.js'
import {
  listings,
  platformSettings,
  reports,
  stores,
  transactions,
  users,
} from '../../db/schema.js'

export function createAdminRepository(db: Db) {
  return {
    async listUsers(opts: { search?: string; role?: string; page: number; limit: number }) {
      const offset = (opts.page - 1) * opts.limit
      const conditions = []

      if (opts.search) {
        conditions.push(
          or(ilike(users.name, `%${opts.search}%`), ilike(users.email, `%${opts.search}%`)),
        )
      }
      if (opts.role) {
        conditions.push(eq(users.role, opts.role as 'buyer' | 'seller' | 'admin'))
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined

      const [rows, total] = await Promise.all([
        db
          .select()
          .from(users)
          .where(where)
          .orderBy(desc(users.createdAt))
          .limit(opts.limit)
          .offset(offset),
        db.select({ count: count() }).from(users).where(where),
      ])

      return { rows, total: total[0]?.count ?? 0 }
    },

    getUserById(id: string) {
      return db.select().from(users).where(eq(users.id, id)).limit(1)
    },

    updateUserRole(id: string, role: 'buyer' | 'seller') {
      return db
        .update(users)
        .set({ role, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning()
    },

    suspendUser(id: string) {
      return db
        .update(users)
        .set({ suspendedAt: new Date(), updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning()
    },

    unsuspendUser(id: string) {
      return db
        .update(users)
        .set({ suspendedAt: null, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning()
    },

    deleteUser(id: string) {
      return db.delete(users).where(eq(users.id, id)).returning()
    },

    async listListings(opts: { search?: string; page: number; limit: number }) {
      const offset = (opts.page - 1) * opts.limit
      const conditions = []

      if (opts.search) {
        conditions.push(ilike(listings.title, `%${opts.search}%`))
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined

      const [rows, total] = await Promise.all([
        db
          .select({
            id: listings.id,
            storeId: listings.storeId,
            title: listings.title,
            category: listings.category,
            condition: listings.condition,
            price: listings.price,
            availability: listings.availability,
            deletedAt: listings.deletedAt,
            createdAt: listings.createdAt,
            storeHandle: stores.handle,
          })
          .from(listings)
          .leftJoin(stores, eq(listings.storeId, stores.id))
          .where(where)
          .orderBy(desc(listings.createdAt))
          .limit(opts.limit)
          .offset(offset),
        db.select({ count: count() }).from(listings).where(where),
      ])

      return { rows, total: total[0]?.count ?? 0 }
    },

    softDeleteListing(id: string, _reason: string) {
      return db
        .update(listings)
        .set({ deletedAt: new Date(), updatedAt: new Date() })
        .where(eq(listings.id, id))
        .returning()
    },

    async listStores(opts: { search?: string; page: number; limit: number }) {
      const offset = (opts.page - 1) * opts.limit
      const conditions = []

      if (opts.search) {
        conditions.push(
          or(ilike(stores.name, `%${opts.search}%`), ilike(stores.handle, `%${opts.search}%`)),
        )
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined

      const [rows, total] = await Promise.all([
        db
          .select()
          .from(stores)
          .where(where)
          .orderBy(desc(stores.createdAt))
          .limit(opts.limit)
          .offset(offset),
        db.select({ count: count() }).from(stores).where(where),
      ])

      return { rows, total: total[0]?.count ?? 0 }
    },

    updateStoreBadge(storeId: string, badge: 'new' | 'verified' | 'top') {
      return db
        .update(stores)
        .set({ badge, updatedAt: new Date() })
        .where(eq(stores.id, storeId))
        .returning()
    },

    suspendStore(storeId: string) {
      return db
        .update(listings)
        .set({ deletedAt: new Date(), updatedAt: new Date() })
        .where(and(eq(listings.storeId, storeId), isNull(listings.deletedAt)))
    },

    async listReports(opts: { status?: string; page: number; limit: number }) {
      const offset = (opts.page - 1) * opts.limit
      const conditions = []

      if (opts.status) {
        conditions.push(
          eq(reports.status, opts.status as 'pending' | 'resolved' | 'dismissed'),
        )
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined

      const [rows, total] = await Promise.all([
        db
          .select()
          .from(reports)
          .where(where)
          .orderBy(desc(reports.createdAt))
          .limit(opts.limit)
          .offset(offset),
        db.select({ count: count() }).from(reports).where(where),
      ])

      return { rows, total: total[0]?.count ?? 0 }
    },

    updateReportStatus(id: string, status: 'resolved' | 'dismissed') {
      return db.update(reports).set({ status }).where(eq(reports.id, id)).returning()
    },

    getPlatformSettings() {
      return db.select().from(platformSettings)
    },

    updatePlatformSetting(key: string, value: unknown) {
      return db
        .update(platformSettings)
        .set({ value, updatedAt: new Date() })
        .where(eq(platformSettings.key, key))
        .returning()
    },

    async getOverviewStats() {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())

      const [
        totalUsersResult,
        totalSellersResult,
        totalListingsResult,
        monthlyTxResult,
        newSignupsResult,
        activeListingsResult,
      ] = await Promise.all([
        db.select({ count: count() }).from(users),
        db.select({ count: count() }).from(users).where(eq(users.role, 'seller')),
        db.select({ count: count() }).from(listings),
        db
          .select({ count: count() })
          .from(transactions)
          .where(gte(transactions.completedAt, startOfMonth)),
        db.select({ count: count() }).from(users).where(gte(users.createdAt, startOfDay)),
        db
          .select({ count: count() })
          .from(listings)
          .where(and(eq(listings.availability, 'available'), isNull(listings.deletedAt))),
      ])

      return {
        totalUsers: totalUsersResult[0]?.count ?? 0,
        totalSellers: totalSellersResult[0]?.count ?? 0,
        totalListings: totalListingsResult[0]?.count ?? 0,
        transactionsThisMonth: monthlyTxResult[0]?.count ?? 0,
        newSignupsToday: newSignupsResult[0]?.count ?? 0,
        activeListings: activeListingsResult[0]?.count ?? 0,
      }
    },
  }
}

export type AdminRepository = ReturnType<typeof createAdminRepository>
