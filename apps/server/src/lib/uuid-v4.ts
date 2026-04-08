import { z } from 'zod'

const uuidV4 = z
  .string()
  .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i, 'Invalid id')

export function parseUuidV4(id: string): string {
  return uuidV4.parse(id)
}
