# Velvet Crumb Bakery — E-Commerce Website

## Overview

A full-stack e-commerce website for Velvet Crumb Bakery, a 100% vegetarian cake
shop in 12 Baker's Lane, Demo City (established 2018). The site lets local
customers browse and order cakes and celebration products without
creating an account, pay securely online via Razorpay, and track their
order status using an Order ID. The shop owner manages the entire
catalog, inventory, and order lifecycle through a dedicated admin
panel. The platform must be production-grade: secure, fast, and able
to comfortably handle ~200 orders/day with room to grow.

## Goals

1. Let a customer go from landing on the site to a paid, confirmed
   order in under 5 steps, with no login required.
2. Guarantee delivery-area accuracy — never allow an order to be
   placed if the address falls outside the shop's 5 km radius.
3. Guarantee payment integrity — no duplicate orders, no lost
   payments, idempotent handling of every Razorpay webhook event.
4. Give the shop owner (single admin) full control of catalog,
   stock, orders, and shop-open/closed status from one clean panel.
5. Ship with strong security defaults (OWASP-aligned) and solid
   local SEO from day one, not bolted on later.

## Core User Flow

1. Customer lands on homepage, browses top-level categories (Cakes or Celebration Products) to view subcategory cards (e.g. Birthday Cakes, Anniversary Cakes, Bouquets & Flowers), selects a subcategory to browse products, and uses search/flavor filters.
2. Customer opens a product, selects a variant (e.g. cake weight),
   adds to cart. No login/account required.
3. Customer proceeds to checkout: enters name, mobile number
   (entered twice for confirmation, format-validated), email,
   shipping address, optional special instructions.
4. System validates the address is within the 5 km delivery radius.
   If not, checkout is blocked with a clear message.
5. Customer reviews a confirmation screen ("We'll contact you at
   [number] about your order") before proceeding to payment.
6. Customer selects a delivery time slot (within 1/2/3/4 hours).
7. Customer pays via Razorpay. On success, a receipt number is
   generated, a receipt is emailed, and the order enters "Order
   Received" status. A WhatsApp deep link is shown so the customer
   can proactively confirm their order if they choose.
8. The admin performs a manual confirmation call/WhatsApp message
   before moving the order to "Processing" — this is the real
   verification layer for contact details, catching any wrong
   number or address issue an automated check would miss.
9. Customer can look up order status (Order Received → Processing →
   Packaging → Out for Delivery → Delivered) using their Order ID/
   receipt number — no login required.

## Features

### Storefront
- Product catalog: Two-level Category > Subcategory hierarchy (Fix-05). Top-level categories (Cakes, Celebration Products) feature subcategory cards; subcategories (Birthday Cakes, Anniversary Cakes, Occasion Cakes, Designer Cakes, Bouquets & Flowers, Gifts & Hampers) house product listings with flavor filters and search.
- Product variants (e.g. weight: 500g, 1kg, 2kg) with independent stock and pricing.
- Search by name/flavor/keyword; filter by flavor (admin-managed list linked via `flavorId` FK, Fix-12).
- Cart (session-based signed cookie `cart_session`, no account required).
- Sitewide Active Order Status Banner: Powered by signed `active_order_session` cookie issued on successful payment, showing live minimal order status without exposing PII.
- A dedicated "Custom Cakes" page that redirects to WhatsApp — no in-site custom order flow (confirmed decision).
- Legal pages: Privacy Policy, T&C, Return & Refund Policy, Shipping Policy.

### Checkout & Fulfillment
- No registration/login — guest checkout only.
- No automated OTP — mobile number captured via double-entry confirmation, format validation, and a pre-payment review step; real verification happens via the admin's manual confirmation call/WhatsApp before an order moves to Processing.
- Delivery radius validation (5 km straight-line radius using Google Maps Geocoding API + Haversine formula).
- Delivery time slot selection (within 1/2/3/4 hours).
- No delivery fee, no coupons/discounts, no GST calculation.
- Razorpay-only payment (no COD) with post-payment `PaymentProcessingOverlay` loading state (Fix-15).
- Stock reserved atomically at checkout via `reserveStockAtomic`, confirmed on payment success via `confirmOrderStock`, released automatically on failure/cancellation/timeout via `releaseOrderReservation` (Fix-01).
- 2-Factor order tracking (`POST /api/orders/track` requiring receipt number + phone match) with 1-hour post-delivery privacy auto-expiry (tracking lookups return 404 exactly 1 hour after reaching `DELIVERED` status).
- Automated email receipt on successful payment sent via `NotificationOutbox` + Brevo REST API.
- Downloadable PDF invoice generation (`/api/orders/[id]/invoice`) with defense-in-depth session authorization.

### Admin Panel
- Single administrator, secure bcrypt auth (`admin_session` cookie).
- Multi-variant management per product (independent weights, pricing, stock levels).
- ImageKit integration with magic-byte file signature validation (JPEG, PNG, WEBP, GIF) and 5 MB size limit (Fix-04, Phase 6).
- Product/category/variant/flavor CRUD, stock management, and soft-delete slug reuse (Fix-07).
- Nested category & subcategory management with category deletion protection (blocks deletion if active subcategories or any active/soft-deleted product references it, Fix-10).
- Flavor management with product usage counts, inline edit/rename, and SetNull cascade deletion (Fix-12).
- Shop Open/Closed toggle (blocks checkout when closed, shows storefront modal).
- Order management: view orders, update tracking status, manual order cancellation with stock release, view payment status, view admin audit log (logins, price/stock changes, deletions, shop status, SEO edits).
- Loading overlays (`LoadingOverlay.tsx`) on all admin mutations to prevent double-click duplicate actions (Fix-08).
- Basic content and SEO field management per product.

## Scope

### In Scope
- Guest-only storefront and checkout as described above
- Razorpay integration with full payment-state handling
- Admin panel for one administrator
- SEO (technical + local + product-level)
- Security hardening per `code-standards.md` and `architecture.md`

### Out of Scope (v1)
- Customer accounts/login
- Cash on delivery
- Coupons, discounts, GST/tax calculation
- Delivery staff accounts / rider tracking
- Multi-admin / role-based admin access
- Wider bakery/snacks menu (pizzas, burgers, farsans, etc. seen in
  brochure) — confirmed out of scope for v1; may be a later phase

## Success Criteria

1. A customer can browse, add to cart, complete checkout (with phone
   double-entry confirmation), pay via Razorpay, and receive an
   emailed receipt — entirely without an account.
2. An address outside the 5 km radius is reliably blocked before
   payment, with a clear message shown.
3. No payment webhook event can create a duplicate or corrupted
   order under retry/failure conditions.
4. The admin can manage the entire catalog and fulfill orders
   end-to-end without developer intervention.
5. The site passes a basic OWASP-style review (see
   `architecture.md` invariants and `code-standards.md`) before
   launch.
