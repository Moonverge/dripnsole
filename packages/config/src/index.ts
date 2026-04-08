import { z } from 'zod'

const serverEnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(4000),
    FRONTEND_URL: z.string().url().optional(),
    DATABASE_URL: z.string().url(),
    REDIS_URL: z.string().url().optional(),
    ALLOWED_ORIGINS: z
      .string()
      .min(1)
      .transform((s) =>
        s
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean),
      ),
    CDN_BASE_URL: z.string().url().optional(),
    CDN_DOMAIN: z.string().min(1).optional(),
    JWT_ACCESS_PRIVATE_KEY_PEM: z.string().min(1).optional(),
    JWT_ACCESS_PUBLIC_KEY_PEM: z.string().min(1).optional(),
    JWT_REFRESH_SECRET: z.string().min(1).optional(),
    FB_APP_ID: z.string().optional(),
    FB_APP_SECRET: z.string().optional(),
    IG_APP_ID: z.string().optional(),
    IG_APP_SECRET: z.string().optional(),
    CLOUDFLARE_R2_BUCKET: z.string().optional(),
    CLOUDFLARE_R2_ENDPOINT: z.string().url().optional(),
    CLOUDFLARE_R2_ACCESS_KEY: z.string().optional(),
    CLOUDFLARE_R2_SECRET_KEY: z.string().optional(),
    TOKEN_ENCRYPTION_KEY: z
      .string()
      .regex(/^[0-9a-fA-F]{64}$/)
      .optional(),
    APP_VERSION: z.string().default('0.0.1'),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === 'production') {
      if (!data.REDIS_URL) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'REDIS_URL is required in production',
          path: ['REDIS_URL'],
        })
      }
      if (!data.JWT_ACCESS_PRIVATE_KEY_PEM || !data.JWT_ACCESS_PUBLIC_KEY_PEM) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'JWT_ACCESS_PRIVATE_KEY_PEM and JWT_ACCESS_PUBLIC_KEY_PEM are required in production',
          path: ['JWT_ACCESS_PRIVATE_KEY_PEM'],
        })
      }
      if (!data.TOKEN_ENCRYPTION_KEY) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'TOKEN_ENCRYPTION_KEY (64 hex chars) is required in production for social token encryption',
          path: ['TOKEN_ENCRYPTION_KEY'],
        })
      }
    }
  })

export type ServerEnv = z.output<typeof serverEnvSchema> & { FRONTEND_URL: string }

function formatEnvIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.length ? issue.path.join('.') : '(root)'
      return `  • ${path}: ${issue.message}`
    })
    .join('\n')
}

export function parseServerEnv(env: NodeJS.ProcessEnv = process.env): ServerEnv {
  const result = serverEnvSchema.safeParse(env)
  if (!result.success) {
    throw new Error(`Invalid server environment:\n${formatEnvIssues(result.error)}`)
  }
  const d = result.data
  const primaryOrigin = d.ALLOWED_ORIGINS[0]
  return {
    ...d,
    FRONTEND_URL: d.FRONTEND_URL ?? primaryOrigin ?? 'http://localhost:3000',
  }
}
