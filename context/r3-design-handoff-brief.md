# Velvet Crumb Bakery — Phase R3 Visual Redesign Handoff Brief

## 1. Project Summary

**Velvet Crumb Bakery** is a premium, 100% vegetarian artisan bakery e-commerce platform based in Demo City, Mumbai. The platform enables customers to browse eggless cakes and celebration products, verify delivery eligibility within a 5 km radius, select custom delivery time windows, pay securely via Razorpay, track order status in real time, and download official PDF tax invoices. It also includes a full single-shop admin panel for inventory, multi-variant pricing, order processing, shop status toggling, and audit logging.

> [!IMPORTANT]
> **THIS IS A VISUAL REDESIGN ONLY.** All business logic, state management, API routes, database schemas, authentication controls, payment workflows, security gates, and custom hook interfaces must remain **100% byte-for-byte unchanged**. You are tasked solely with improving visual aesthetics, layout structure, responsive UX, typography, micro-animations, and Tailwind CSS styling across presentation components.

---

## 2. Brand Identity & UI Design System (`ui-context.md`)

### Surface Modes
- **Storefront Surface (Default)**: Warm cream page background (`--bg-base`), clean white card containers (`--bg-surface`), deep navy text (`--text-primary`), vibrant orange CTA accents (`--accent-primary`), gold badges (`--accent-secondary`). Approachable, warm, easy to shop.
- **Showcase Surface (Hero / Featured Strips)**: Dark navy/black background (`--bg-showcase`), glowing gold/orange highlights, white/gray text. Matches the premium landing reference aesthetic.

### Color Tokens
| Role | CSS Variable | Hex Value | Usage |
| :--- | :--- | :--- | :--- |
| Page Background | `--bg-base` | `#FFF8F0` | Storefront main body background |
| Dark Showcase BG | `--bg-showcase` | `#141414` | Homepage hero, footer, dark cards, overlays |
| Surface / Card | `--bg-surface` | `#FFFFFF` | Product tiles, form containers, modals |
| Primary Text | `--text-primary` | `#1B1F3B` | Main headings, body copy, navy accents |
| Muted Text | `--text-muted` | `#6B6B6B` | Secondary labels, descriptions, timestamps |
| Primary Accent | `--accent-primary` | `#F0791A` | Main CTA buttons, active state highlights, spinners |
| Secondary Accent | `--accent-secondary` | `#C9A24B` | Featured badges, star ratings, borders, highlights |
| Border Default | `--border-default` | `#E8DCCB` | Card outlines, input borders, divider lines |
| Error State | `--state-error` | `#D14343` | Error banners, invalid field outlines, out-of-stock |
| Success State | `--state-success` | `#3F9142` | Success alerts, completed timeline stages, 100% Veg |

### Typography Tokens
- **Display / Headings (`--font-display`)**: Elegant serif font (`Playfair Display` / font-serif).
- **Body / UI Text (`--font-sans`)**: Clean sans-serif font (`Jost` / `GeistSans`).

### Border Radius Conventions
- **Inline / Small UI (`rounded-md`)**: Buttons, input fields, filter pills (`6px`).
- **Cards / Product Tiles (`rounded-xl` / `rounded-2xl`)**: Product cards, category cards (`12px` / `16px`).
- **Modals / Overlays (`rounded-3xl`)**: Dialog overlays, payment processing card (`24px`).

### Established Loading & Processing Overlay Visual Conventions
- **Admin Loading Overlay** (`components/admin/LoadingOverlay.tsx`): Translucent dark backdrop (`bg-[#141414]/40 backdrop-blur-[1.5px]`), centered card with `--accent-primary` (`#F0791A`) spinner and `--text-primary` (`#1B1F3B`) message label. Blocks pointer events on underlying form controls during in-flight server actions.
- **Payment Processing Overlay** (`components/storefront/PaymentProcessingOverlay.tsx`): Full-screen dark backdrop (`bg-[#141414]/70 backdrop-blur-md`), elevated card with dual-ring orange spinner, `ShieldCheck` badge, status messaging, and window `beforeunload` navigation guard while Razorpay webhook confirmation processes in background.
- **Overlay Redesign Policy**: The functional triggers, pointer-event blocking, and `beforeunload` guards of `LoadingOverlay.tsx` and `PaymentProcessingOverlay.tsx` must remain strictly intact, but their visual presentation (backdrop blur intensity, overlay colors, card container styling, spinner animation, typography, and icons) **IS OPEN TO REDESIGN** to align with the new visual aesthetic.

---

## 3. Hard Boundary — ALLOWED Files

Only files in this explicit list may be modified or replaced for visual redesign. If a file is not on this list, **do not open it, do not edit it, and do not reference its internal implementation**.

```
app/globals.css
app/layout.tsx
app/page.tsx
components/storefront/HomePageClient.tsx
components/storefront/Navbar.tsx
components/storefront/Footer.tsx
components/storefront/ActiveOrderStatusBanner.tsx
components/storefront/ProductCard.tsx
components/storefront/Breadcrumbs.tsx
app/categories/[slug]/page.tsx
components/storefront/CategoryListingClient.tsx
app/products/[slug]/page.tsx
components/storefront/ProductDetailClient.tsx
app/search/page.tsx
components/storefront/SearchClient.tsx
components/storefront/CartDrawer.tsx
app/checkout/page.tsx
components/storefront/PaymentProcessingOverlay.tsx
app/orders/[receiptNumber]/page.tsx
app/orders/track/page.tsx
components/storefront/OrderTrackingClient.tsx
app/custom-cakes/page.tsx
components/storefront/CustomCakesClient.tsx
app/admin/login/page.tsx
app/admin/dashboard/page.tsx
components/admin/LoadingOverlay.tsx
app/privacy-policy/page.tsx
app/terms-conditions/page.tsx
app/return-refund-policy/page.tsx
app/shipping-policy/page.tsx
```

> [!NOTE]
> **`app/globals.css` Decision**: `app/globals.css` is **ALLOWED** to be edited. The design agent may modify `app/globals.css` to add or update global CSS variables (`--bg-base`, `--accent-primary`, etc.), font imports, Tailwind `@layer` utility classes, keyframe animations, or design tokens required for the visual redesign.

---

## 4. Hard Boundary — FORBIDDEN Files & Directories

These locations contain backend business logic, database ORM schemas, payment integration logic, notification gateways, authentication state, and environment security controls.

### Blanket Rule for `lib/`
**ALL OF `lib/` IS STRICTLY OFF-LIMITS FOR EDITING.** You must NEVER edit, modify, rename, or delete any file in `lib/`. 

**Callable Exemption**: You MAY import and call the existing helper functions in `lib/imagekit-url.ts` (`getProductImages`, `getFirstProductImage`, `getOptimizedImageUrl`) and `lib/cache.ts` inside presentation components, but you must **NEVER modify** the files themselves under any circumstance.

### Explicitly Forbidden Locations:
- `lib/` (entire directory — no edits permitted; callable helpers in `lib/imagekit-url.ts` and `lib/cache.ts` may be imported/called only)
- `lib/hooks/` (all hook files — do not edit, do not open)
- `app/api/` (all API routes — do not edit)
- `prisma/` (schema and migrations — do not edit)
- `lib/db/` (database client — do not edit)
- `lib/payments/` (reservation and Razorpay logic — do not edit)
- `lib/notifications/` (email sender and outbox — do not edit)
- `lib/auth/` (session and rate-limiting — do not edit)
- `lib/cart/cart.ts` (cart calculations — do not edit)
- `middleware.ts` (route protection & security headers — do not edit)
- `.env`, `.env.example`, `.env.local` (environment variables — do not edit)

---

## 5. Hook Contracts & Return Interfaces

All business logic has been extracted into custom hooks inside `lib/hooks/`. The presentation components consume these hooks. Below are the **exact property and handler names and types** returned by each of the **14 custom hooks** in `lib/hooks/`. Your redesigned UI components must consume these exact properties and handlers without changing signatures or call conditions.

### Index of Documented Custom Hooks:
1. `lib/hooks/useCart.ts`
2. `lib/hooks/useHomePage.ts`
3. `lib/hooks/useCategoryListing.ts`
4. `lib/hooks/useProductDetail.ts`
5. `lib/hooks/useSearch.ts`
6. `lib/hooks/useOrderTracking.ts`
7. `lib/hooks/useCheckout.ts`
8. `lib/hooks/useOrderConfirmation.ts`
9. `lib/hooks/useAdminLogin.ts`
10. `lib/hooks/useAdminProducts.ts`
11. `lib/hooks/useAdminCategories.ts`
12. `lib/hooks/useAdminFlavors.ts`
13. `lib/hooks/useAdminOrders.ts`
14. `lib/hooks/useAdminShopSettings.ts`

---

### 5.1 `useCart()` (`lib/hooks/useCart.ts`)
- **Return Interface**:
  - `cart: { items: CartDrawerItem[], totalAmount: number, itemCount: number }`
  - `isCartOpen: boolean`
  - `setIsCartOpen: (open: boolean) => void`
  - `openCart: () => void`
  - `closeCart: () => void`
  - `loading: boolean`
  - `loadCart: () => Promise<void>`
  - `handleQuickAdd: (variantId: string, quantity?: number) => Promise<void>`
  - `handleUpdateQuantity: (variantId: string, quantity: number) => Promise<void>`
  - `handleRemoveItem: (variantId: string) => Promise<void>`
- **Consumed By**: `components/storefront/CartDrawer.tsx`, composed inside `useHomePage`, `useCategoryListing`, `useProductDetail`, `useSearch`, `useCheckout`.

### 5.2 `useHomePage()` (`lib/hooks/useHomePage.ts`)
- **Return Interface**:
  - `products: ProductData[]`
  - `flavors: FlavorData[]`
  - `selectedFlavor: string`
  - `setSelectedFlavor: (flavor: string) => void`
  - `filteredProducts: ProductData[]`
  - `featuredProduct: ProductData | undefined`
  - `heroImageUrl: string`
  - `cart: CartData`
  - `isCartOpen: boolean`
  - `setIsCartOpen: (open: boolean) => void`
  - `loading: boolean`
  - `handleQuickAdd: (variantId: string, quantity?: number) => Promise<void>`
  - `handleUpdateQuantity: (variantId: string, quantity: number) => Promise<void>`
  - `handleRemoveItem: (variantId: string) => Promise<void>`
- **Consumed By**: `components/storefront/HomePageClient.tsx`.

### 5.3 `useCategoryListing()` (`lib/hooks/useCategoryListing.ts`)
- **Return Interface**:
  - `slug: string`
  - `category: CategoryData | null`
  - `allCategories: CategoryData[]`
  - `subcategories: CategoryData[]`
  - `products: ProductData[]`
  - `allProducts: ProductData[]`
  - `flavors: FlavorData[]`
  - `selectedFlavor: string`
  - `setSelectedFlavor: (flavor: string) => void`
  - `searchQuery: string`
  - `setSearchQuery: (query: string) => void`
  - `filtered: ProductData[]`
  - `isTopLevel: boolean`
  - `breadcrumbItems: Array<{ label: string; url: string }>`
  - `cart: CartData`
  - `isCartOpen: boolean`
  - `setIsCartOpen: (open: boolean) => void`
  - `loading: boolean`
  - `handleQuickAdd: (variantId: string, quantity?: number) => Promise<void>`
  - `handleUpdateQuantity: (variantId: string, quantity: number) => Promise<void>`
  - `handleRemoveItem: (variantId: string) => Promise<void>`
- **Consumed By**: `components/storefront/CategoryListingClient.tsx`.

### 5.4 `useProductDetail()` (`lib/hooks/useProductDetail.ts`)
- **Return Interface**:
  - `slug: string`
  - `product: ProductData | null`
  - `selectedVariant: ProductVariant | undefined`
  - `selectedVariantId: string`
  - `setSelectedVariantId: (id: string) => void`
  - `quantity: number`
  - `setQuantity: (qty: number | ((prev: number) => number)) => void`
  - `availableStock: number`
  - `isAvailable: boolean`
  - `activeImageIndex: number`
  - `setActiveImageIndex: (idx: number) => void`
  - `imagesList: string[]`
  - `currentImage: string`
  - `message: { type: 'error' | 'success'; text: string } | null`
  - `setMessage: (msg: { type: 'error' | 'success'; text: string } | null) => void`
  - `breadcrumbItems: Array<{ label: string; url: string }>`
  - `jsonLd: Record<string, unknown> | null`
  - `cart: CartData`
  - `isCartOpen: boolean`
  - `setIsCartOpen: (open: boolean) => void`
  - `loading: boolean`
  - `handleAddToCart: () => Promise<void>`
  - `handleUpdateQuantity: (variantId: string, quantity: number) => Promise<void>`
  - `handleRemoveItem: (variantId: string) => Promise<void>`
- **Consumed By**: `components/storefront/ProductDetailClient.tsx`.

### 5.5 `useSearch()` (`lib/hooks/useSearch.ts`)
- **Return Interface**:
  - `query: string`
  - `setQuery: (query: string) => void`
  - `products: ProductData[]`
  - `searchFiltered: ProductData[]`
  - `cart: CartData`
  - `isCartOpen: boolean`
  - `setIsCartOpen: (open: boolean) => void`
  - `loading: boolean`
  - `handleQuickAdd: (variantId: string, quantity?: number) => Promise<void>`
  - `handleUpdateQuantity: (variantId: string, quantity: number) => Promise<void>`
  - `handleRemoveItem: (variantId: string) => Promise<void>`
- **Consumed By**: `components/storefront/SearchClient.tsx`.

### 5.6 `useCheckout()` (`lib/hooks/useCheckout.ts`)
- **Return Interface**:
  - `cart: CartData`
  - `isCartOpen: boolean`
  - `setIsCartOpen: (open: boolean) => void`
  - `loading: boolean`
  - `isConfirmingPayment: boolean`
  - `name: string`, `setName: (val: string) => void`
  - `email: string`, `setEmail: (val: string) => void`
  - `phone: string`, `setPhone: (val: string) => void`
  - `confirmPhone: string`, `setConfirmPhone: (val: string) => void`
  - `address: string`, `setAddress: (val: string) => void`
  - `deliveryTimeSlot: string`, `setDeliveryTimeSlot: (slot: string) => void`
  - `specialInstructions: string`, `setSpecialInstructions: (val: string) => void`
  - `radiusStatus: RadiusStatus`, `setRadiusStatus: (status: RadiusStatus) => void`
  - `handleCheckRadius: () => Promise<void>`
  - `isReviewing: boolean`, `setIsReviewing: (val: boolean) => void`
  - `submitting: boolean`
  - `errorMessage: string | null`, `setErrorMessage: (msg: string | null) => void`
  - `handleOpenReview: (e: React.FormEvent) => void`
  - `handleFinalSubmit: () => Promise<void>`
  - `handleUpdateQuantity: (variantId: string, quantity: number) => Promise<void>`
  - `handleRemoveItem: (variantId: string) => Promise<void>`
- **Consumed By**: `app/checkout/page.tsx`.

### 5.7 `useOrderConfirmation(receiptNumber: string)` (`lib/hooks/useOrderConfirmation.ts`)
- **Return Interface**:
  - `order: OrderConfirmationData | null`
  - `loading: boolean`
  - `invoiceUrl: string`
  - `whatsappUrl: string`
  - `loadOrder: (attempt?: number) => Promise<void>`
- **Consumed By**: `app/orders/[receiptNumber]/page.tsx`.

### 5.8 `useOrderTracking()` (`lib/hooks/useOrderTracking.ts`)
- **Return Interface**:
  - `receiptNumber: string`, `setReceiptNumber: (val: string) => void`
  - `phone: string`, `setPhone: (val: string) => void`
  - `loading: boolean`
  - `errorMessage: string | null`, `setErrorMessage: (msg: string | null) => void`
  - `trackingData: OrderTrackingData | null`
  - `STAGES: Array<{ key: string; label: string; icon: React.ComponentType }>`
  - `handleTrackOrder: (e: React.FormEvent) => Promise<void>`
- **Consumed By**: `components/storefront/OrderTrackingClient.tsx`.

### 5.9 `useAdminLogin()` (`lib/hooks/useAdminLogin.ts`)
- **Return Interface**:
  - `email: string`, `setEmail: (val: string) => void`
  - `password: string`, `setPassword: (val: string) => void`
  - `error: string`
  - `loading: boolean`
  - `handleSubmit: (e: React.FormEvent) => Promise<void>`
- **Consumed By**: `app/admin/login/page.tsx`.

### 5.10 `useAdminProducts()` (`lib/hooks/useAdminProducts.ts`)
- **Return Interface**:
  - `products: ProductItem[]`, `filteredProducts: ProductItem[]`
  - `prodSearchQuery: string`, `setProdSearchQuery: (q: string) => void`
  - `prodCategoryFilter: string`, `setProdCategoryFilter: (catId: string) => void`
  - `editingProductId: string | null`
  - `prodName: string`, `setProdName: (val: string) => void`
  - `prodSlug: string`, `setProdSlug: (val: string) => void`
  - `prodCatId: string`, `setProdCatId: (val: string) => void`
  - `prodDesc: string`, `setProdDesc: (val: string) => void`
  - `prodFlavor: string`, `setProdFlavor: (val: string) => void`
  - `prodIsFeatured: boolean`, `setProdIsFeatured: (val: boolean) => void`
  - `prodImages: Array<{ url: string; fileId?: string }>`, `setProdImages: ...`
  - `uploadingImage: boolean`
  - `formVariants: Array<{ id?: string; label: string; price: string; stockQuantity: string; reservedQuantity?: number }>`
  - `setFormVariants: ...`
  - `isSubmittingProd: boolean`, `deletingProdId: string | null`
  - `prodMessage: string`, `setProdMessage: (msg: string) => void`
  - `loadProducts: () => Promise<void>`
  - `handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>`
  - `handleRemoveImage: (index: number) => void`
  - `handleAddVariantRow: () => void`
  - `handleRemoveVariantRow: (index: number) => void`
  - `handleVariantChange: (index: number, field: 'label' | 'price' | 'stockQuantity', value: string) => void`
  - `resetProductForm: () => void`
  - `handleEditProduct: (p: ProductItem) => void`
  - `handleDeleteProduct: (p: ProductItem) => Promise<void>`
  - `handleSaveProduct: (e: React.FormEvent) => Promise<void>`
- **Consumed By**: `app/admin/dashboard/page.tsx`.

### 5.11 `useAdminCategories()` (`lib/hooks/useAdminCategories.ts`)
- **Return Interface**:
  - `categories: CategoryItem[]`
  - `catName: string`, `setCatName: (val: string) => void`
  - `catSlug: string`, `setCatSlug: (val: string) => void`
  - `catType: 'CAKE' | 'CELEBRATION'`, `setCatType: (type: 'CAKE' | 'CELEBRATION') => void`
  - `catParentId: string`, `setCatParentId: (val: string) => void`
  - `isSubmittingCat: boolean`, `deletingCatId: string | null`
  - `catMessage: string`, `setCatMessage: (msg: string) => void`
  - `loadCategories: () => Promise<void>`
  - `handleCreateCategory: (e: React.FormEvent) => Promise<void>`
  - `handleDeleteCategory: (id: string, name: string) => Promise<void>`
- **Consumed By**: `app/admin/dashboard/page.tsx`.

### 5.12 `useAdminFlavors(onFlavorsChanged?: () => void)` (`lib/hooks/useAdminFlavors.ts`)
- **Return Interface**:
  - `flavors: FlavorItem[]`
  - `flavorName: string`, `setFlavorName: (val: string) => void`
  - `editingFlavorId: string | null`, `setEditingFlavorId: (id: string | null) => void`
  - `editingFlavorName: string`, `setEditingFlavorName: (val: string) => void`
  - `deletingFlavorId: string | null`
  - `isSubmittingFlavor: boolean`, `isSubmittingEditFlavor: boolean`
  - `flavorMessage: string`, `setFlavorMessage: (msg: string) => void`
  - `loadFlavors: () => Promise<void>`
  - `handleCreateFlavor: (e: React.FormEvent) => Promise<void>`
  - `handleStartEditFlavor: (f: FlavorItem) => void`
  - `handleSaveEditFlavor: (id: string) => Promise<void>`
  - `handleDeleteFlavor: (f: FlavorItem, currentProducts?: ProductItem[]) => Promise<void>`
- **Consumed By**: `app/admin/dashboard/page.tsx`.

### 5.13 `useAdminOrders()` (`lib/hooks/useAdminOrders.ts`)
- **Return Interface**:
  - `orders: OrderItem[]`
  - `orderSearch: string`, `setOrderSearch: (q: string) => void`
  - `paymentFilter: 'SUCCESS' | 'ALL' | 'PENDING' | 'FAILED' | 'EXPIRED' | 'CANCELLED'`, `setPaymentFilter: ...`
  - `processingOrderId: string | null`
  - `orderMessage: string`, `setOrderMessage: (msg: string) => void`
  - `loadOrders: () => Promise<void>`
  - `handleAdvanceOrderStatus: (orderId: string, currentStatus?: string | null) => Promise<void>`
  - `handleCancelOrder: (orderId: string) => Promise<void>`
- **Consumed By**: `app/admin/dashboard/page.tsx`.

### 5.14 `useAdminShopSettings()` (`lib/hooks/useAdminShopSettings.ts`)
- **Return Interface**:
  - `shopSettings: { isOpen: boolean; openingHours: string }`
  - `isTogglingShop: boolean`
  - `shopMessage: string`, `setShopMessage: (msg: string) => void`
  - `loadShopSettings: () => Promise<void>`
  - `handleToggleShopStatus: () => Promise<void>`
- **Consumed By**: `app/admin/dashboard/page.tsx`.

---

## 6. Complete Frontend Inventory & Behavior Specification (`frontend-inventory.md`)

Below is the verbatim specification of all page components, user actions, visual states, third-party mounting rules, and accessibility constraints:

```markdown
# Velvet Crumb Bakery — Frontend Component & Page Inventory

This document provides a complete, self-contained inventory of every page, component, user action, data dependency, visual state, accessibility requirement, third-party integration, and brand design token in the Velvet Crumb Bakery storefront and admin panel.

---

## 1. Global Brand & Design System Tokens

### Surface Modes
- Storefront Surface (Default): Warm cream page background (--bg-base), white card containers (--bg-surface), navy text (--text-primary), orange CTA accents (--accent-primary), gold badges (--accent-secondary).
- Showcase Surface (Hero / Featured Strips): Dark navy/black background (--bg-showcase), glowing gold/orange highlights, white/gray text.

### Color Tokens
Page Background: #FFF8F0
Dark Showcase BG: #141414
Surface / Card: #FFFFFF
Primary Text: #1B1F3B
Muted Text: #6B6B6B
Primary Accent: #F0791A
Secondary Accent: #C9A24B
Border Default: #E8DCCB
Error State: #D14343
Success State: #3F9142

### Typography Tokens
Display / Headings: Elegant serif font (Playfair Display / font-serif).
Body / UI Text: Clean sans-serif font (Jost / GeistSans).

### Border Radius Conventions
Inline / Small UI (rounded-md): 6px
Cards / Product Tiles (rounded-xl / rounded-2xl): 12px / 16px
Modals / Overlays (rounded-3xl): 24px

---

## 2. Storefront Layout & Global Components

### 2.1 Root Layout (app/layout.tsx)
- Purpose: Global HTML document shell providing font definitions, SEO metadata defaults, OpenGraph/Twitter cards, favicon cache-busting, and JSON-LD structured data.
- Data Dependencies: process.env.NEXT_PUBLIC_APP_URL.
- Children: Renders LocalBusinessSchema and page content.
- Accessibility: Valid HTML lang="en", semantic metadata tags.

### 2.2 Navbar (components/storefront/Navbar.tsx)
- Purpose: Top storefront navigation header featuring authentic Velvet Crumb Bakery logo, category links, search trigger, custom cakes CTA, and reactive cart badge.
- Data Dependencies: Props: cartItemCount: number, onOpenCart: () => void.
- User Actions & Handlers:
  - Logo / Home Link: Navigates to /.
  - Category Links ("Cakes", "Celebration Products", "Custom Cakes"): Navigates to respective storefront pages.
  - Search Button: Navigates to /search.
  - Cart Button: Calls onOpenCart(), displaying item count badge when cartItemCount > 0.
  - Mobile Menu Toggle: Toggles hamburger navigation menu.
- States:
  - Default desktop view / Mobile collapsed view.
  - Mobile menu expanded (isOpen = true).
  - Cart count badge: Hidden when cartItemCount === 0, visible orange pill when > 0.
- Accessibility: Keyboard focusable links/buttons, aria-label="Toggle mobile menu", aria-label="Open Cart".

### 2.3 Footer (components/storefront/Footer.tsx)
- Purpose: Bottom page footer containing brand info, shop address, contact links, WhatsApp CTA, quick navigation links, legal links, and copyright notice.
- Data Dependencies: Static bakery info (12 Baker's Lane, Demo City, +91 9999900000).
- User Actions:
  - Quick Links (Cakes, Celebration, Custom Cakes, Tracking): Navigates to pages.
  - Legal Links (Privacy, Terms, Return/Refund, Shipping): Navigates to legal pages.
  - WhatsApp CTA: Opens https://wa.me/... deep link in new tab.
- Accessibility: Semantic <footer> tag, accessible link labels.

### 2.4 Sitewide Active Order Status Banner (components/storefront/ActiveOrderStatusBanner.tsx)
- Purpose: Fixed top notification banner displayed to returning customer browsers with an active paid order in flight.
- Data Dependencies: Calls GET /api/orders/active-status on mount.
- User Actions:
  - "Track Order" Button: Navigates to /orders/track?receiptNumber=....
  - Dismiss Button (X): Calls setDismissed(true), hiding banner for current session.
- States:
  - Hidden / Inactive: activeOrder === null or dismissed === true.
  - Active Banner: Renders dark banner (#141414) with orange badge, order receipt number, mapped status label, and Track button.

---

## 3. Storefront Pages & Components

### 3.1 Homepage (app/page.tsx & components/storefront/HomePageClient.tsx)
- Purpose: Storefront landing page showcasing hero cake banner, category selection cards, featured products grid, flavor filter pills, and local bakery trust badges.
- Data Dependencies: Consumes useHomePage() hook.
- User Actions: Category cards navigate to category pages; flavor pills filter grid; Quick Add dispatches handleQuickAdd.

### 3.2 Product Card (components/storefront/ProductCard.tsx)
- Purpose: Reusable card component displaying product image, eggless badge, name, flavor tag, starting price, variant selector preview, and Quick Add button.
- User Actions: Title/image navigates to PDP; dropdown switches variant; Quick Add dispatches onQuickAdd(variantId). Out of stock variants disable button.

### 3.3 Category / Subcategory Listing Page (app/categories/[slug]/page.tsx & CategoryListingClient.tsx)
- Purpose: Dynamic category browse page supporting top-level subcategory cards and subcategory product listing grids with flavor filters and keyword search.
- User Actions: Subcategory cards navigate to sub-slug; search input filters list; flavor pills filter list; Quick Add dispatches handleQuickAdd.

### 3.4 Search Page (app/search/page.tsx & SearchClient.tsx)
- Purpose: Dedicated search page reading ?q= query param, providing real-time text filtering across active products.

### 3.5 Product Detail Page (PDP) (app/products/[slug]/page.tsx & ProductDetailClient.tsx)
- Purpose: Full product detail page featuring ImageKit image gallery, variant selection, available live stock calculation, quantity selector, add-to-cart, eggless guarantee badge, and SEO content block.
- User Actions: Thumbnail click switches main image; variant pill updates price/stock; quantity adjuster updates quantity; Add to Cart dispatches handleAddToCart.

### 3.6 Cart Drawer (components/storefront/CartDrawer.tsx)
- Purpose: Slide-over cart panel displaying item list, image thumbnails, variant labels, live calculated prices, item totals, quantity adjusters, subtotal, and Checkout CTA.
- User Actions: Quantity +/- calls onUpdateQuantity; Trash icon calls onRemoveItem; Proceed to Checkout navigates to /checkout.

---

## 4. Checkout & Fulfillment Flow

### 4.1 Checkout Page (app/checkout/page.tsx)
- Purpose: Step-by-step guest checkout flow handling customer details double-entry phone validation, 5 km delivery radius geocoding check, time slot selection, pre-submission review screen, Razorpay modal payment launch, and shop-closed blocking.
- User Actions & Handlers:
  - Address Input + "Verify Delivery Distance": Calls handleCheckRadius.
  - Form Submit: Validates phone match and radius.
  - "Proceed to Pay": Calls handleFinalSubmit, launching Razorpay Checkout modal.
- Third-Party Integration: Razorpay widget mounted via new window.Razorpay(options).open().

### 4.2 Payment Processing Overlay (components/storefront/PaymentProcessingOverlay.tsx)
- Purpose: Full-screen modal overlay displayed immediately upon Razorpay payment completion.

---

## 5. Post-Order, Tracking & Legal Pages

### 5.1 Order Confirmation & PDF Invoice Page (app/orders/[receiptNumber]/page.tsx)
- Purpose: Customer order confirmation page displaying receipt number, order status timeline, delivery details, ordered items summary, WhatsApp confirmation deep link, and Download PDF Invoice CTA.

### 5.2 Order Tracking Page (app/orders/track/page.tsx & OrderTrackingClient.tsx)
- Purpose: Two-factor customer order status lookup page requiring receipt number and phone number, rendering a 5-stage progress timeline.
- Security Rule: Once an order reaches DELIVERED status, tracking lookups automatically return generic 404 error 1 hour after delivery timestamp to protect customer privacy.

### 5.3 Custom Cakes Page (app/custom-cakes/page.tsx & CustomCakesClient.tsx)
- Purpose: Static informational page explaining custom cake ordering options with direct WhatsApp CTA button.

---

## 6. Admin Panel

### 6.1 Admin Login Page (app/admin/login/page.tsx)
- Purpose: Secure admin login page for single shop administrator. Displays error banner for invalid credentials or 15-minute rate limit locks.

### 6.2 Admin Dashboard Layout & Page (app/admin/dashboard/page.tsx)
- Purpose: Unified control panel for shop owner managing Products, Categories, Flavors, Orders, Shop Settings, and Audit Logs. Wraps all actions with LoadingOverlay to block double-click dispatches.

### 6.3 Admin Loading Overlay (components/admin/LoadingOverlay.tsx)
- Purpose: Translucent backdrop overlay with spinner and label used across all admin server actions.
```

---

## 7. Explicit Redesign Instructions

When executing the visual redesign:

1. **Styling & Layout Scope**: You may **only** change JSX layout structure, Tailwind CSS classes, responsive grid breakpoints, animations, font declarations, icon choices, and visual presentation within the ALLOWED files listed in Section 3.
2. **Hook Contract Integrity**: You **must** preserve every prop call, state variable, and handler dispatch to the custom hooks exactly as documented in Section 5 — matching names, argument shapes, and execution triggers.
3. **Functional State Preservation**: You **must** preserve every visual state and user feedback mechanism specified in Section 6 and `frontend-inventory.md`. Do not remove, hide, or alter functional indicators (e.g. Out of Stock pills, shop-closed warnings, address radius check results, form error banners, loading spinners, 100% Veg badges).
4. **Clarification Rule**: If you are ever uncertain whether a code construct represents presentation styling or underlying business logic, **ask for clarification immediately** rather than guessing.

---

## 8. Closing Verification Notice

After all visual redesign edits are completed, a thorough multi-phase verification process will be run against your output:

1. **Per-Component Verification**: Individual component rendering and hook bindings will be audited.
2. **Full Verification Suite**: The full verification suite (executed via `node scripts/run-all-verifications.js` and any additional feature- or fix-specific verification scripts covering stock reservations, delivery radius geocoding validation, payment webhooks, database rate-limiting enforcement, PDF invoice authorization, and order status timelines) will be executed against your output. **100% PASS IS MANDATORY.**
3. **Clean Production Build (`npm run build`)**: The TypeScript compiler and Next.js App Router builder will compile the application. **0 COMPILATION ERRORS ARE PERMITTED.**

Expect your changes to be strictly validated for behavioral and technical correctness, not just visual aesthetics.
