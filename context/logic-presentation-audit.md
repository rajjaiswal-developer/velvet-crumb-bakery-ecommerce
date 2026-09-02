# Velvet Crumb Bakery — Logic vs. Presentation Separation Audit

This audit evaluates the codebase's frontend components to determine whether business logic (data fetching, state management, validation, API mutation calls, state machines) is cleanly separated from presentation (JSX markup, layout, styling).

It serves as the technical basis for **Phase R2 (Refactor & Decoupling)**, identifying which components must be refactored into custom React hooks or headless logic containers before any visual redesign (Phase R3) begins. Decoupling these components guarantees that visual redesign tools can safely modify styling files without any risk of altering runtime behavior or breaking checkout/inventory logic.

---

## 1. Summary of Audit Findings

- **Total Components Audited**: 18
- **Cleanly Separated (Presentation-Only / Props-Driven)**: 9 components (50%)
- **Tangled / Coupled (Remaining Phase R2 Targets)**: 9 components (50%)

---

## 2. Refactor Status & Candidate List

### 2.1 `app/admin/dashboard/page.tsx` — ✅ RESOLVED (Phase R2 Step 1)
- **Refactor Completed**: Extracted business logic into 5 dedicated domain hooks in [`lib/hooks/`](file:///d:/Code%20playground/velvet-crumb-bakery/lib/hooks):
  - [`useAdminProducts.ts`](file:///d:/Code%20playground/velvet-crumb-bakery/lib/hooks/useAdminProducts.ts): Handles product search/filtering, ImageKit upload with magic-byte checks, multi-variant weight/price array state, edit modal, and soft deletion.
  - [`useAdminCategories.ts`](file:///d:/Code%20playground/velvet-crumb-bakery/lib/hooks/useAdminCategories.ts): Handles category tree hierarchy building, category/subcategory CRUD, and RESTRICT deletion protection pre-checks.
  - [`useAdminFlavors.ts`](file:///d:/Code%20playground/velvet-crumb-bakery/lib/hooks/useAdminFlavors.ts): Handles flavor CRUD, usage count badges, inline rename, and SetNull deletion prompts.
  - [`useAdminOrders.ts`](file:///d:/Code%20playground/velvet-crumb-bakery/lib/hooks/useAdminOrders.ts): Handles order status filtering, stage advancement, and manual cancellation with stock release.
  - [`useAdminShopSettings.ts`](file:///d:/Code%20playground/velvet-crumb-bakery/lib/hooks/useAdminShopSettings.ts): Handles Shop Open/Closed toggle & settings.
- **Current Component State**: [`app/admin/dashboard/page.tsx`](file:///d:/Code%20playground/velvet-crumb-bakery/app/admin/dashboard/page.tsx) is a clean presentation layout composing these 5 hooks with 0 inline API fetches or raw state handlers.

### 2.2 `app/checkout/page.tsx` — ✅ RESOLVED (Phase R2 Step 1)
- **Refactor Completed**: Extracted all business logic into [`lib/hooks/useCheckout.ts`](file:///d:/Code%20playground/velvet-crumb-bakery/lib/hooks/useCheckout.ts):
  - Handles customer details form input, double-entry phone validation (`phone === confirmPhone`), 10-digit Indian phone regex check, Google Geocoding address radius check (`/api/checkout/validate-address`), delivery time slot selection, review step state (`isReviewing`), Razorpay payment order creation (`/api/checkout/create-payment-order`), dynamic Razorpay SDK script injection, Razorpay payment success callback dispatch (`/api/webhooks/razorpay`), modal dismissal cancellation, and payment processing overlay trigger state (`isConfirmingPayment`).
- **Current Component State**: [`app/checkout/page.tsx`](file:///d:/Code%20playground/velvet-crumb-bakery/app/checkout/page.tsx) is a thin presentation component consuming `useCheckout()` with zero inline fetch calls, validation rules, or Razorpay SDK code.

### 2.3 `components/storefront/HomePageClient.tsx` — ✅ RESOLVED (Phase R2 Step 2)
- **Refactor Completed**: Extracted business logic into [`lib/hooks/useHomePage.ts`](file:///d:/Code%20playground/velvet-crumb-bakery/lib/hooks/useHomePage.ts):
  - Handles products/flavors/cart fetching, flavor pill selection, hero featured-product resolution with Fix-16 ImageKit URL optimization (`getFirstProductImage` / `getOptimizedImageUrl`), and cart mutations (`POST`, `PUT`, `DELETE` to `/api/cart`).
- **Current Component State**: Clean presentation component consuming `useHomePage()` with zero inline fetch calls or image parameter calculations.

### 2.4 `components/storefront/CategoryListingClient.tsx` — ✅ RESOLVED (Phase R2 Step 2)
- **Refactor Completed**: Extracted business logic into [`lib/hooks/useCategoryListing.ts`](file:///d:/Code%20playground/velvet-crumb-bakery/lib/hooks/useCategoryListing.ts):
  - Handles category tree parsing, top-level vs. subcategory slug resolution, in-category search filtering, flavor filtering, breadcrumb items construction, and cart mutations.
- **Current Component State**: Clean presentation component consuming `useCategoryListing()`.

### 2.5 `components/storefront/ProductDetailClient.tsx` — ✅ RESOLVED (Phase R2 Step 2)
- **Refactor Completed**: Extracted business logic into [`lib/hooks/useProductDetail.ts`](file:///d:/Code%20playground/velvet-crumb-bakery/lib/hooks/useProductDetail.ts):
  - Handles live uncached PDP data fetching (`/api/products/public/[slug]`), variant selection state, available-stock calculation (`stockQuantity - reservedQuantity`), quantity clamping, image gallery thumbnail selection with Fix-16 helpers, breadcrumb items construction, Schema.org JSON-LD generation, and add-to-cart dispatch.
- **Current Component State**: Clean presentation component consuming `useProductDetail()`.

### 2.6 `components/storefront/OrderTrackingClient.tsx` — ✅ RESOLVED (Phase R2 Step 2)
- **Refactor Completed**: Extracted business logic into [`lib/hooks/useOrderTracking.ts`](file:///d:/Code%20playground/velvet-crumb-bakery/lib/hooks/useOrderTracking.ts):
  - Handles receipt number + phone input state, 10-digit Indian phone regex validation, tracking API lookup (`POST /api/orders/track`), 5-stage timeline calculation, stage status mapping (including Fix-14 terminal stage label correction), and uniform generic error handling for wrong inputs / 1-hour privacy auto-expiry.
- **Current Component State**: Clean presentation component consuming `useOrderTracking()`.

### 2.7 `components/storefront/SearchClient.tsx` — ✅ RESOLVED (Phase R2 Step 2)
- **Refactor Completed**: Extracted business logic into [`lib/hooks/useSearch.ts`](file:///d:/Code%20playground/velvet-crumb-bakery/lib/hooks/useSearch.ts):
  - Handles `useSearchParams` URL query param binding (`?q=`), real-time search filtering across product name, description, flavor, and category, and cart mutation actions.
- **Current Component State**: Clean presentation component consuming `useSearch()`.

### 2.8 `components/storefront/CartDrawer.tsx` (LOW-MODERATE COUPLING) — [RESOLVED IN PHASE R2]
- **Extracted Hook**: `lib/hooks/useCart.ts`
- **Current Component State**: Clean presentation drawer component receiving state and dispatches from `useCart()`. Also composed into `useHomePage`, `useCategoryListing`, `useProductDetail`, and `useSearch`.

### 2.9 `app/admin/login/page.tsx` (LOW-MODERATE COUPLING) — [RESOLVED IN PHASE R2]
- **Extracted Hook**: `lib/hooks/useAdminLogin.ts`
- **Current Component State**: Clean presentation component consuming form state, submission logic, and 429 rate-limiting error handlers from `useAdminLogin()`.

### 2.10 `app/orders/[receiptNumber]/page.tsx` (LOW-MODERATE COUPLING) — [RESOLVED IN PHASE R2]
- **Extracted Hook**: `lib/hooks/useOrderConfirmation.ts`
- **Current Component State**: Clean presentation component consuming 5-attempt polling status, PDF invoice helper URL, and WhatsApp share link from `useOrderConfirmation(receiptNumber)`.

### 2.11 `app/custom-cakes/page.tsx` & `CustomCakesClient.tsx` (LOW COUPLING) — [RESOLVED IN PHASE R2]
- **Current Component State**: Evaluated and kept as a pure static presentation component. Static WhatsApp pre-filled contact link retained without over-engineering.

---

## 3. Cleanly Separated Presentation Components (No Refactor Needed)

The following 7 components are cleanly separated presentation components driven entirely by props or headless schemas. They can be safely redesigned in Phase R3 without code refactoring:

1. **`components/storefront/Navbar.tsx`**: Presentation header accepting `cartItemCount` and `onOpenCart` props.
2. **`components/storefront/Footer.tsx`**: Pure presentation footer component.
3. **`components/storefront/ProductCard.tsx`**: Presentation card accepting `product` and `onQuickAdd` callback.
4. **`components/storefront/ActiveOrderStatusBanner.tsx`**: Self-contained banner driven by `/api/orders/active-status`.
5. **`components/admin/LoadingOverlay.tsx`**: Pure presentation overlay driven by `isLoading` prop.
6. **`components/storefront/PaymentProcessingOverlay.tsx`**: Pure presentation overlay driven by `isVisible` prop.
7. **`components/storefront/Breadcrumbs.tsx`**: Pure presentation breadcrumb trail driven by `items` prop.

---

## 4. Execution Plan for Phase R2 (Refactor & Decoupling)

Prior to initiating any visual redesign in Phase R3:
1. Create a `lib/hooks/` directory.
2. Extract business logic, form states, and API dispatches from the 11 coupled components above into custom React hooks (`useCheckout`, `useAdminDashboard`, `useProductDetail`, `useCart`, `useCategoryListing`, `useOrderTracking`).
3. Verify that all 12 regression test scripts (`node scripts/run-all-verifications.js`) pass with 100% success after the R2 refactor.
4. Hand off the cleanly separated presentation components to visual redesign tools for Phase R3 styling updates.
