# Architecture Context

## Stack

| Layer          | Technology                              | Role                                                |
| -------------- | ---------------------------------------- | ---------------------------------------------------- |
| Frontend       | Next.js 14 (App Router) + TypeScript     | Storefront, checkout, order tracking, admin UI, SEO   |
| Backend        | Next.js API routes (serverless)          | All business logic and mutations — no standalone server |
| Hosting        | Vercel (Hobby/free tier)                 | Frontend + API routes, no cold-start spin-down issue  |
| Database       | PostgreSQL                               | Products, variants, orders, admin, settings — single source of truth |
| DB Hosting     | Neon (free tier)                         | Serverless Postgres, no forced pause (unlike Supabase free tier) |
| ORM            | Prisma                                   | Type-safe queries, migrations, schema-enforced constraints |
| Media Storage  | ImageKit                                 | Product images, banners — on-the-fly transformations |
| Email          | Brevo (free tier, 300/day)               | Order receipts — chosen over Resend (100/day cap is too low for 200 orders/day target) |
| Payments       | Razorpay                                 | Order creation, payment capture, webhooks             |
| Phone verification | None automated                      | Double-entry + format validation + admin manual confirmation call (see Auth and Access Model) |
| Geocoding      | Google Maps Geocoding API + Haversine formula (own code) | 5 km straight-line delivery-radius validation |
| Background jobs | Vercel `waitUntil()` + Postgres outbox table + GitHub Actions scheduled workflow (free, every 5-10 min) | Non-blocking notification delivery, expired-reservation cleanup |
| Backups        | Scheduled `pg_dump` via GitHub Actions → Backblaze B2 (free 10GB) | Neon's free tier only gives 6h point-in-time recovery, not real backups |
| WhatsApp (opt.)| Descoped for v1 (email receipt + `wa.me` deep link) | Candidate for a fast-follow phase |

## System Boundaries

- `app/` — Next.js App Router: public storefront pages (category,
  product, cart, checkout, order tracking) and the admin panel UI.
  Server components by default; client components only where
  interactivity is required (cart, address/phone double-entry form,
  admin forms).
- `app/api/` — all backend logic, as Next.js Route Handlers (this
  replaces the standalone Express server from the original plan):
  - `app/api/products/`, `app/api/categories/`, `app/api/flavors/` —
    public read endpoints + admin-gated write endpoints
  - `app/api/checkout/` — cart validation, delivery radius check,
    stock reservation, Razorpay order creation
  - `app/api/webhooks/razorpay/` — signature verification, idempotent
    payment-state transitions, order confirmation
  - `app/api/admin/` — all admin-only routes, gated by auth middleware (`/api/admin/orders` with server-side pagination, `/api/admin/orders/poll` for consolidated lightweight polling)
  - `app/api/cron/` — protected routes called only by the GitHub
    Actions scheduler (release expired reservations, retry failed
    outbox entries), verified via a shared secret header
- `lib/db/` — Prisma client singleton and query helpers. No other
  module constructs its own Prisma client or writes raw SQL.
- `lib/payments/` — Razorpay integration only. Owns order creation,
  stock reservation, webhook signature verification, idempotent
  payment-state transitions. No other module writes payment status
  directly.
- `lib/notifications/` — Brevo sender plus outbox helpers. Called via
  `waitUntil()` after a response is sent, never synchronously inside
  a request handler.
- `lib/validation/` — Zod schemas shared between client forms and API
  route handlers.
- `prisma/schema.prisma` — the single source of truth for the data
  model. Migrations are generated from this file, never hand-written
  against the database directly.

## Storage Model

- **PostgreSQL (via Prisma)**: all structured data.
  - `Product` — slug (public URL, indexed via `@@index([slug])` to allow soft-deleted products to retain historical slugs while API routes enforce active-product uniqueness, Fix-07) + internal UUID/`id`, `isDeleted` (soft delete), `isActive`, `isFeatured` (showcase hero flag), SEO fields, relation to `Variant`, and optional `flavorId` foreign key referencing `Flavor` (`onDelete: SetNull`, Fix-12). Deleting a `Flavor` automatically clears `flavorId` to `null` on all associated products without deleting the products. **Permanent Delete (Fix-18)**: Soft-deleted products (`isDeleted: true`) with zero references in any `Order.items` JSON may be permanently and irreversibly removed from the database via `DELETE /api/admin/products/[id]/permanent`. The order-reference check uses PostgreSQL's jsonb containment operator (`items::jsonb @> '[{"productId": "<id>"}]'::jsonb` via `Prisma.$queryRaw`) to structurally verify the product's UUID appears as a `productId` key in the order items array — not a substring text match. Products referenced by even one real order are permanently blocked from permanent deletion to preserve order history integrity. This closes the category-deletion dead-end from Fix-10: once an orphaned test/mistake product is permanently deleted, its former category's `RESTRICT` constraint is satisfied and the category becomes deletable again.
  - `Variant` — `stockQuantity`, `reservedQuantity`, `price`, belongs to a `Product`; `stockQuantity >= 0` and `reservedQuantity >= 0` enforced as database CHECK constraints, not just application logic.
  - `Category` — two-level self-referential hierarchy (`parentId` referencing parent category with `onDelete: Restrict`, Fix-05). Top-level categories (e.g. "Cakes", "Celebration Products") have `parentId: null` and display subcategory cards in storefront navigation; subcategories (e.g. "Birthday Cakes", "Anniversary Cakes") have `parentId` pointing to their top-level parent and hold actual product assignments. Deleting any category referenced by ANY product (whether active or soft-deleted, per Fix-10 and PostgreSQL `RESTRICT` constraint) or active subcategories is strictly blocked.
  - `Flavor` — optional attribute on `Product` via `flavorId` foreign key (`onDelete: SetNull`, Fix-12). Flavor edit (rename) updates display name across all products live; flavor deletion atomically sets `flavorId` to `null` on referencing products without blocking deletion.
  - `Order` — never deleted; `receiptNumber` (human-readable, e.g. `AC-1785048047785-457`) independent from `id`; `customerMobile` (required 10-digit primary phone with double-entry confirmation), `alternatePhone` (optional 10-digit backup contact number), `customerEmail` (optional email address); `orderStatus` (enum: `ORDER_RECEIVED`, `PROCESSING`, `PACKAGING`, `OUT_FOR_DELIVERY`, `DELIVERED`, `CANCELLED`) and `paymentStatus` (enum: `PENDING`, `SUCCESS`, `FAILED`, `CANCELLED`, `EXPIRED`) as separate enum columns.
  - `OrderStatusHistory` — timestamped record per status transition (`id`, `orderId`, `status`, `changedAt`).
  - `Admin` — email, `passwordHash`.
  - `ShopSettings` — singleton row: open/closed, hours, contact info, delivery radius, WhatsApp number, `shopLatitude`, `shopLongitude` (Float? fields for exact bakery geocoding, Fix-02), social links, business name/address — no business config hardcoded in code.
  - `LoginAttempt` — `id`, `key`, `createdAt` (indexed via `@@index([key, createdAt])`, Phase 1 Targeted Fix): powers database-backed rate limiting across serverless function instances with opportunistic cleanup of expired records older than 15 minutes.
  - `ServiceableArea` — reference table (`id`, `name` unique, `isActive` boolean @default(true), `createdAt`, `updatedAt`). Powers the storefront checkout Area dropdown for fast locality selection and server-side active area validation. Managed via admin CRUD (`/api/admin/serviceable-areas`). Does not alter `Order.shippingAddress` storage, which remains a combined string field.
  - `NotificationTemplate` — order confirmation, payment success/failed, receipt, contact acknowledgment — editable without a deploy.
  - `AuditLog` — admin login, price/stock changes, product deletes, shop status changes, SEO edits.
  - `NotificationOutbox` — pending/failed notification jobs, written in the same transaction as the triggering event, processed by `waitUntil()` first and the GitHub Actions backstop on retry.
- **ImageKit**: all product images and banner media. Postgres stores only the ImageKit URL/file ID object structure (`[{ url, fileId }]`), never binary image data, and never pre-generated size variants — responsive/optimized delivery uses ImageKit's URL-based transformation parameters at request time (`w`, `h`, `q`, `f-auto`, Fix-16).
- **No customer accounts table** — checkout data (name, mobile, email, address) is stored only on the `Order` row itself, not in a separate reusable customer/profile record, since there is no login system.
- **On-Demand Cache Architecture**:
  - **Catalog Listings (Homepage, Categories, Subcategories, Flavors, Search)**: Cached using Next.js `unstable_cache` with cache tags (`catalog`, `products`, `categories`, `flavors`). Purged instantly on demand when admin routes create, update, or delete products, categories, subcategories, or flavors via `revalidateCatalog()` (`revalidateTag` & `revalidatePath` in `lib/cache.ts`).
  - **Product Detail Page (PDP), Checkout, Cart & Invoices**: Completely uncached (`export const dynamic = 'force-dynamic'`, `Cache-Control: no-store`). PDP variant stock and price data (`/api/products/public/[slug]`), cart (`/api/cart`), checkout, order tracking, and PDF invoices (`/api/orders/[id]/invoice`) always fetch live from PostgreSQL DB per Invariant 1.

## Auth and Access Model

- **Customers & 2-Factor Order Tracking Security Model**: No authentication and no automated OTP. Checkout captures the mobile number with double-entry confirmation, format validation, and an explicit pre-payment review step. The shop admin performs a manual confirmation call/WhatsApp message during the "Order Received" → "Processing" transition as the real verification layer. Order tracking lookup (`POST /api/orders/track`) enforces a two-factor security model requiring an exact match of both `receiptNumber` AND `customerMobile`. Furthermore, once an order reaches `DELIVERED` status, tracking lookups automatically expire after 1 hour (calculated from the `DELIVERED` status transition `changedAt` timestamp in `OrderStatusHistory`), returning a generic 404 error response (`"No matching order found..."`) identical to incorrect lookups to prevent enumeration attacks and protect customer PII.
- **Dedicated Signing Keys & Key Isolation**: The application utilizes four separate signing and security key domains, each backed by its own dedicated environment variable. These represent strictly separate trust domains and must NEVER share a secret key:
  1. `ADMIN_SESSION_SECRET`: Signs admin identity JWTs (`admin_session` HttpOnly cookie) verified by middleware (`middleware.ts`) and `lib/auth/session.ts`.
  2. `CART_SESSION_SECRET`: Signs storefront cart JWT cookies (`cart_session`) in `lib/cart/cart.ts` containing raw item references.
  3. `ORDER_SESSION_SECRET`: Signs active customer order tracking cookies (`active_order_session` HttpOnly cookie) issued server-side upon verified payment success in `lib/auth/order-session.ts`. Powers the sitewide status banner and PDF invoice authorization without exposing admin privileges or customer PII.
  4. `CRON_SECRET`: Authenticates background job cron requests (`/api/cron/*`) via shared secret HTTP headers.
- **Admin**: exactly one administrator account. Login via email/username + password (hashed with bcrypt). Session managed via secure, HttpOnly, SameSite cookies. All `app/api/admin/*` routes and `app/(admin)/*` pages are protected by auth middleware — no unauthenticated path may reach admin mutation logic, even indirectly. Security-relevant admin actions are written to `AuditLog`.
- **Payment state**: only the Razorpay webhook handler (after signature verification) or the payment-capture confirmation flow may transition `order.paymentStatus`. No other code path writes to it.
- **Cart**: identified by a signed, HttpOnly cookie (`cart_session`), storing raw item IDs and quantities — allows server-side validation and live database price/stock resolution on every request rather than trusting client-submitted prices or stock.
- **Cron routes**: `app/api/cron/*` routes verify a shared `CRON_SECRET` header before doing any work — they are otherwise regular public HTTP endpoints (Vercel/GitHub Actions cron just sends a normal request), so this check is mandatory.
- **Active Order Session Cookie & Status Banner**: Customer browsers that complete a successful payment receive an HttpOnly, Secure, SameSite=strict signed JWT cookie (`active_order_session`) issued strictly server-side by `GET /api/orders/public` when `paymentStatus === 'SUCCESS'`. The cookie is signed using a dedicated secret (`ORDER_SESSION_SECRET`), separating customer order status tracking from admin identity credentials. It powers a lightweight sitewide status banner that calls `GET /api/orders/active-status` and returns ONLY minimal status (`receiptNumber`, `orderStatus`) with ZERO customer PII exposed. The banner's "Track Order" button navigates to `/orders/track` (requiring receipt number + phone number), preserving the existing 2-Factor tracking page protection without bypass. PDF invoice generation (`GET /api/orders/[id]/invoice`) requires `paymentStatus === 'SUCCESS'` and enforces a defense-in-depth authorization check (valid signed `active_order_session` cookie matching `order.id`, admin session, or matching `phone` parameter).

## Invariants

1. No order is created or confirmed without a server-side delivery
   radius check passing first (Google Geocoding API + Haversine
   distance calculation) — the frontend distance check is UX only
   and must never be trusted as the source of truth.
2. Stock is reserved atomically at Razorpay order-creation time
   (checkout submission), not at cart-add time, using a conditional
   update (`stockQuantity - reservedQuantity >= requestedQty`) inside
   a Prisma transaction via `reserveStockAtomic`. The reservation has a
   short 15-minute TTL (`reservationExpiry`):
   - **Confirmed permanently** via `confirmOrderStock` (decrements both `stockQuantity` and `reservedQuantity` together) inside a Prisma transaction upon verified payment success (`paymentStatus = SUCCESS`).
   - **Released automatically** via `releaseOrderReservation` (decrements `reservedQuantity` and clears `reservationExpiry`) on payment failure, cancellation, or TTL expiry (`paymentStatus = FAILED` / `CANCELLED` / `EXPIRED`).
   This prevents overselling and guarantees no customer can pay for an item that is sold out.
3. `orderStatus` and `paymentStatus` are independent enum columns,
   each a strict state machine — invalid transitions (e.g.
   `Delivered` → `Processing`, or advancing `orderStatus` while
   `paymentStatus` is not `Success`) are rejected at the data-access
   layer, not just the UI.
   - `paymentStatus`: Pending → Success / Failed / Cancelled / Expired
   - `orderStatus` (only advances once `paymentStatus = Success`):
     Order Received → Processing → Packaging → Out for Delivery →
     Delivered
4. Razorpay webhook events are verified by signature and processed
   idempotently, keyed on Razorpay Payment ID + Razorpay Order ID +
   internal Order ID — safe to receive the same event twice without
   creating duplicate orders, double-decrementing stock, or double-
   confirming a reservation.
5. The full payment-confirmation sequence (verify payment → create/
   confirm order → reduce inventory → save payment record → generate
   receipt number) runs as a single Prisma database transaction. Any
   failure in that sequence rolls back the whole transaction — never
   a partially-committed order. This is a genuine advantage of the
   Postgres/Prisma switch over the original MongoDB plan.
6. Admin routes are unreachable without a valid authenticated admin
   session — enforced in middleware, not left to individual route
   handlers to remember.
7. No raw/unvalidated client input reaches a database query or is
   rendered without encoding — all external input is validated with
   Zod at the API boundary (see `code-standards.md`). Prisma's
   parameterized queries prevent SQL injection by construction as
   long as raw SQL is never hand-built from user input.
8. Notifications are never sent synchronously inside a request
   handler in a way that blocks the response. A notification job is
   written to `NotificationOutbox` in the same transaction as the
   triggering event; `waitUntil()` attempts immediate delivery after
   the response is sent, and the GitHub Actions cron retries anything
   still unsent after a few minutes. A receipt-email job is enqueued
   if and only if `paymentStatus` transitions to `Success`.
9. Customer-facing errors never expose stack traces, raw database
   errors, or internal implementation details — a generic message is
   shown, full detail goes to server-side logs only.
10. Route handlers do not perform long-running work (e.g. large image
    processing) synchronously — offload where needed rather than
    blocking the response, respecting Vercel's function duration
    limits.
