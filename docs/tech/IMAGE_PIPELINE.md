# Image pipeline

1. **Upload** `POST /api/upload` (JWT, multipart, max 8 files).
2. **MIME**: compare declared type to **magic bytes** (JPEG / PNG / WebP).
3. **Decode**: `sharp` metadata read in a try/catch; reject malformed images.
4. **Transform**: auto-orient (`rotate()`), resize max dimension 1200px (`fit: inside`, no enlargement), convert to **WebP**.
5. **EXIF**: stripped as part of the sharp pipeline (no location/device leakage).
6. **Storage**: random UUID filename; `PutObject` to R2; public URL built from `CDN_BASE_URL`.
7. **Database**: row in `listing_photos` with `uploaded_by` set to the uploader; `listing_id` null until attached to a listing.
8. **Orphan cleanup**: background job removes rows (and should delete remote objects—extend job to call R2 delete) for `listing_id IS NULL` and `created_at < now() - 1 hour`.
