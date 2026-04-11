import type { Db } from '../../db/client.js'
import { reports } from '../../db/schema.js'

export function createReportsRepository(db: Db) {
  return {
    createReport(input: {
      reporterId: string
      targetType: 'listing' | 'user'
      targetId: string
      reason: string
      description: string | null
    }) {
      return db.insert(reports).values(input).returning()
    },
  }
}

export type ReportsRepository = ReturnType<typeof createReportsRepository>
