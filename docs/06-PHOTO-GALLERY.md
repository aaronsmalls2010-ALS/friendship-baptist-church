# 06 — Community Photo Gallery (spec + guardrails)

Public, member-contributed photo gallery with an admin moderation gate.

## Scope

**IN**
- Public `/gallery` page: masonry feed of **approved** photos + album filter chips, animated
  (scroll-reveal + per-photo transitions), full-screen lightbox with swipe/prev/next.
- Members (logged in) upload **up to 10** photos at once; mobile-first uploader with
  client-side HEIC→web conversion + compression before upload.
- Every photo shows **"Uploaded by {name} · {date}"**.
- Admin moderation queue `/admin/photos`: pending/approved/rejected, single + **bulk**
  approve/reject (with optional note), delete. Approved → public; nothing public until approved.
- Optional caption + optional album per photo.

**OUT (v1)**
- Public consent checkbox (Aaron's call: admin approval is the gate). A soft "only upload
  photos you have permission to share" reminder + an admin note to reject unauthorized/minor
  photos are included at ~zero cost.
- Likes/comments, per-photo public reporting, EXIF-based auto-albums, video.

## Data model

`gallery_albums(id, name, slug unique, sort_order, created_at)`
`gallery_photos(id, uploader_id→profiles, uploader_name snapshot, caption, album_id→albums,
  status pending|approved|rejected, image_path, thumb_path, width, height, review_note,
  reviewed_by, reviewed_at, created_at, approved_at)`

Two storage buckets: **`gallery-review`** (private — pending originals/derivatives) and
**`gallery-public`** (public CDN — approved only). On approval the derivatives are copied
review→public and the row flips to `approved`; on reject/delete the review objects are removed.

## Guardrails (non-negotiable)

- **RLS default-deny.** Public `SELECT` only where `status='approved'`; uploader sees own rows;
  writes are admin-only (uploader may delete own *pending*). Enable RLS before the API ships.
- **Upload validation.** Magic-byte sniff (`isAllowedImage`, jpeg/png/webp — SVG/HEIC never
  stored raw), ≤15 MB/file, ≤10 files/request, re-encoded through **sharp** to WebP which
  **strips all EXIF/GPS metadata** and normalizes orientation. Server is authoritative even
  though the client also compresses.
- **Authn/z.** Upload requires an authenticated member (`getAuthContext`); moderation requires
  `requireAdmin`. Uploader identity is taken from the verified session, never the request body.
- **Rate limit.** Per-user cap on upload batches.
- **Nothing public before approval.** Pending images live only in the private bucket; the public
  bucket receives an object only at approval time.
- **Accessibility.** Heavy animation must honor `prefers-reduced-motion`; lightbox is keyboard
  operable; images carry alt text (caption or "Photo by {name}").

## Build plan

1. Migration: tables + indexes + RLS + buckets.  2. `lib/gallery/process.ts` (sharp).
3. APIs: `POST /api/gallery/upload`, `GET /api/gallery`, `GET/PATCH/DELETE /api/admin/photos(+bulk)`.
4. Public `/gallery` (masonry + filter + lightbox + uploader modal).  5. `/admin/photos` queue.
6. Nav (public "Photos" under Connect; admin "Photos" under Engagement).  7. `npm run build` verify.

## Definition of done
Member uploads 10 mixed-format (incl. iPhone HEIC) photos on a phone → all convert, compress,
land as pending, invisible to the public → admin bulk-approves → they appear in the animated
public gallery with correct name/date, and EXIF/GPS is gone from the stored files.
