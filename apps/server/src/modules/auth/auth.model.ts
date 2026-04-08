import { createHash } from 'node:crypto'
import { z } from 'zod'

export const REFRESH_COOKIE = 'refresh_token'
export const ACCESS_TTL_SEC = 15 * 60
export const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000

export const registerBodySchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(120),
  website: z.string().max(200).optional(),
})

export const loginBodySchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(1).max(128),
})

export const verifyEmailBodySchema = z.object({
  token: z.string().min(10).max(512),
})

export type RegisterBody = z.infer<typeof registerBodySchema>
export type LoginBody = z.infer<typeof loginBodySchema>
export type VerifyEmailBody = z.infer<typeof verifyEmailBodySchema>

export function hashVerifyToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex')
}
