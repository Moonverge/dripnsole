export const UPLOAD_MAX_FILES = 8
export const UPLOAD_ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'] as const
export type UploadMime = (typeof UPLOAD_ALLOWED_MIMES)[number]
