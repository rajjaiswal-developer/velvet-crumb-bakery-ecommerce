# Code Standards

## General

- Keep modules small and single-purpose — a file that handles
  products should not also handle orders or payments.
- Fix root causes; do not layer workarounds or silent try/catch
  swallowing to make an error "go away."
- Do not mix unrelated concerns in one component, route, or
  function (e.g. do not put email-sending logic inside a product
  handler).
- Every change should be scoped to the feature unit being worked
  on — do not refactor, rename, or "clean up" unrelated code in the
  same change (see `ai-workflow-rules.md`).

## TypeScript

- Strict mode is required throughout the project.
- Avoid `any` — use explicit interfaces/types, especially for
  Order, Product, Variant, and Razorpay webhook payloads. Prisma
  generates types from `schema.prisma` — use those generated types
  rather than redeclaring shapes by hand.
- Validate all unknown external input (form submissions, webhook
  bodies, query params) at the boundary with Zod before trusting it.

## Next.js (Frontend + API Routes)

- Default to server components; add `"use client"` only where
  browser interactivity is required (cart state, phone double-entry
  form, admin forms).
- Route Handlers (`app/api/**/route.ts`) stay focused on a single
  responsibility: parse/validate input with Zod → call a function
  from `lib/` → return a response. Business logic lives in `lib/`
  service functions, not inline in the route handler.
- Enforce auth/admin checks in middleware (`middleware.ts`), applied
  to `app/api/admin/*` and `app/(admin)/*`, not repeated ad hoc
  inside each handler.
- Return consistent, predictable JSON response shapes (e.g.
  `{ success, data }` / `{ success, error }`) across all API routes.
- Keep SEO metadata (title, description, canonical, Open Graph,
  Schema.org) generated per-page using Next.js metadata APIs, driven
  by the admin-managed SEO fields on each product/category.
- Do not fetch or mutate data directly from client components
  against the database — all data access goes through `app/api/`.

## Database (Prisma + PostgreSQL)

- All schema changes go through `prisma/schema.prisma` and a
  generated migration — never modify the database directly outside
  of Prisma Migrate.
- Encode real invariants as database constraints where possible
  (e.g. `CHECK (stock_quantity >= 0)`), not only in application code
  — this is the specific advantage of Postgres over the original
  MongoDB plan and should be used deliberately, not left unused.
- Multi-step writes that must succeed or fail together (payment
  confirmation, stock reservation) use a single `prisma.$transaction`
  — never sequential unwrapped writes for anything covered by an
  `architecture.md` invariant.
- Use Prisma's parameterized query builder for everything; if raw
  SQL is ever unavoidable, it must use Prisma's tagged-template
  `$queryRaw` (parameterized), never string concatenation.

## API Routes / Security

- Validate and parse request input before any business logic runs.
- Enforce auth and, where relevant, admin checks before any
  mutation — never after.
- Payment-related routes must verify Razorpay signatures before
  processing, and must be idempotent (safe against retries and
  duplicate webhook delivery).
- `app/api/cron/*` routes must verify the shared `CRON_SECRET` header
  before doing any work — they are reachable as plain HTTP endpoints.
- **Database-Backed Rate Limiting Standard**: All sensitive endpoints (admin login, checkout submission, address validation, order tracking, admin uploads) MUST use the database-backed rate limiter (`checkRateLimit()` in `lib/auth/rate-limit.ts` backed by PostgreSQL `LoginAttempt` table). Keying strategy: use per-admin-session keying (`upload_admin_${session.adminId}`) for authenticated admin routes and per-IP keying (`upload_ip_${ip}`) for public routes. In-memory rate limiting MUST NOT be used as it bypasses limits across isolated Vercel serverless function instances.
- Enforce HTTPS (handled by Vercel), secure cookies (HttpOnly,
  Secure, SameSite), CSP, and HSTS headers globally (`helmet`-
  equivalent headers configured in `next.config.mjs` / middleware).
- Hash admin passwords with bcrypt — never store plaintext
  or reversibly-encrypted passwords.
- Log security-relevant events (failed admin logins, webhook
  verification failures, rate-limit trips) without logging sensitive
  data (raw passwords, full payment details).

## Data and Storage

- Metadata (product info, prices, stock counts, order records)
  belongs in PostgreSQL.
- **Image Handling & Resolution Helpers**: All product image rendering across storefront components, product grids, PDPs, cart, admin views, and outbox emails MUST use the shared image-resolution helpers in `lib/imagekit-url.ts` (Fix-16):
  - `getProductImages(images)`: Safely parses unknown JSON image fields, handling string arrays, `{ url, fileId }` object arrays, null/undefined, and returning a valid array of image URLs (with fallback to `/placeholder-cake.jpg`).
  - `getFirstProductImage(images)`: Returns the primary product image URL string.
  - `getOptimizedImageUrl(url, options)`: Applies ImageKit transformation parameters (`w`, `h`, `q`, `f-auto`) dynamically at request time. Code MUST NOT construct custom ImageKit query strings manually or invent a fourth way to format product image URLs.
- Images and other large media belong in ImageKit — store only the
  reference URL/file ID object structure (`[{ url, fileId }]`) in the database, never binary data, and never pre-generated size duplicates — use ImageKit's on-the-fly transformation URL parameters instead.
- Do not store card/payment credentials anywhere in this system —
  Razorpay handles that; we store only order/payment status and
  Razorpay's own reference IDs.
- Products use soft delete (`isDeleted`) — never hard-delete a
  product. Orders are never deleted under any circumstance.
- Business configuration (shop hours, delivery radius, contact
  info, social links, etc.) lives in the `ShopSettings` table, never
  hardcoded in application code.
- Notification content lives in the `NotificationTemplate` table,
  not hardcoded strings in the sending code.
- Database transactions (`prisma.$transaction`) must contain ONLY Prisma database operations. Never perform external network calls (`fetch`, ImageKit API uploads, Razorpay API calls, Brevo email sending) inside a transaction callback, as slow network calls hold database connections open and exceed transaction timeouts.

## Loading States & In-Flight Operation Protection

- **Admin Loading Overlay Standard**: Any admin action that triggers a server request or mutation (login, logout, product CRUD, image upload, category CRUD, flavor edit/delete, order status transition, order cancellation, shop status toggle) MUST wrap its interactive form/table section with the reusable `LoadingOverlay` component (`components/admin/LoadingOverlay.tsx`, Fix-08).
- **Customer Payment Processing Overlay Standard**: Customer checkout submission MUST trigger `PaymentProcessingOverlay` (`components/storefront/PaymentProcessingOverlay.tsx`, Fix-15) immediately upon Razorpay payment completion to provide visual feedback during background webhook confirmation and register a `beforeunload` warning.
- **In-Flight Double-Submission Guard**: All client form handlers and action dispatchers MUST enforce in-flight flag guards (`if (isSubmitting) return;`) and disable submit buttons to prevent double-click race conditions and duplicate operations.


## URLs

- Public product/category URLs use slugs, never numeric or UUID
  database IDs (e.g. `/products/chocolate-truffle-cake`, not
  `/products/3f8a...`). The internal `id` stays in the database only.

## Background Work

- Never send a notification (email, future WhatsApp/SMS)
  synchronously inside a request handler in a way that blocks the
  response. Write to `NotificationOutbox` in the same transaction as
  the triggering event, then attempt delivery via `waitUntil()`.
- Do not introduce Redis, BullMQ, or any other job-queue
  infrastructure for this project's current scale (~200 orders/day)
  — the outbox + `waitUntil()` + GitHub Actions cron pattern is the
  standard for this project. Revisit only if volume grows by an
  order of magnitude.

## Error Handling

- Customer-facing responses never include stack traces, raw
  database/Prisma errors, or internal implementation details — show
  a generic message, log full detail server-side only.

## File Organization

- `app/` — pages (storefront + admin) and layouts.
- `app/api/` — Route Handlers, grouped by domain (products, orders,
  checkout, webhooks, admin, cron).
- `lib/db/` — Prisma client and query helpers.
- `lib/payments/` — Razorpay integration.
- `lib/notifications/` — Brevo sender + outbox helpers.
- `lib/validation/` — Zod schemas shared by forms and API routes.
- `prisma/` — `schema.prisma` and generated migrations.
