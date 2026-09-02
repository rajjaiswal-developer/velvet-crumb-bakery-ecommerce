# Velvet Crumb Bakery — Frontend Component & Page Inventory

This document provides a complete, self-contained inventory of every page, component, user action, data dependency, visual state, accessibility requirement, third-party integration, and brand design token in the Velvet Crumb Bakery storefront and admin panel.

It serves as the definitive reference for visual redesign tools and engineers, detailing exact component contracts and behavior so that styling and layout can be redesigned safely without altering application logic or breaking user flows.

---

## 1. Global Brand & Design System Tokens

The visual design system is built on a warm, celebratory, premium bakery aesthetic with two distinct surface modes:

### Surface Modes
- **Storefront Surface (Default)**: Warm cream page background (`--bg-base`), white card containers (`--bg-surface`), navy text (`--text-primary`), orange CTA accents (`--accent-primary`), gold badges (`--accent-secondary`).
- **Showcase Surface (Hero / Featured Strips)**: Dark navy/black background (`--bg-showcase`), glowing gold/orange highlights, white/gray text.

### Color Tokens (`ui-context.md`)
| Token Name | CSS Variable | Hex / Value | Usage |
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

---

## 2. Storefront Layout & Global Components

### 2.1 Root Layout (`app/layout.tsx`)
- **Purpose**: Global HTML document shell providing font definitions, SEO metadata defaults, OpenGraph/Twitter cards, favicon cache-busting, and JSON-LD structured data.
- **Data Dependencies**: `process.env.NEXT_PUBLIC_APP_URL`.
- **Children**: Renders `LocalBusinessSchema` and page content.
- **Accessibility**: Valid HTML `lang="en"`, semantic metadata tags.

### 2.2 Navbar (`components/storefront/Navbar.tsx`)
- **Purpose**: Top storefront navigation header featuring authentic Velvet Crumb Bakery logo, category links, search trigger, custom cakes CTA, and reactive cart badge.
- **Data Dependencies**:
  - Props: `cartItemCount: number`, `onOpenCart: () => void`.
- **User Actions & Handlers**:
  - Logo / Home Link: Navigates to `/`.
  - Category Links ("Cakes", "Celebration Products", "Custom Cakes"): Navigates to respective storefront pages.
  - Search Button: Navigates to `/search`.
  - Cart Button: Calls `onOpenCart()`, displaying item count badge when `cartItemCount > 0`.
  - Mobile Menu Toggle: Toggles hamburger navigation menu.
- **States**:
  - Default desktop view / Mobile collapsed view.
  - Mobile menu expanded (`isOpen = true`).
  - Cart count badge: Hidden when `cartItemCount === 0`, visible orange pill when `> 0`.
- **Accessibility**: Keyboard focusable links/buttons, `aria-label="Toggle mobile menu"`, `aria-label="Open Cart"`.

### 2.3 Footer (`components/storefront/Footer.tsx`)
- **Purpose**: Bottom page footer containing brand info, shop address, contact links, WhatsApp CTA, quick navigation links, legal links, and copyright notice.
- **Data Dependencies**: Static bakery info (`12 Baker's Lane, Demo City`, `+91 9999900000`).
- **User Actions**:
  - Quick Links (Cakes, Celebration, Custom Cakes, Tracking): Navigates to pages.
  - Legal Links (Privacy, Terms, Return/Refund, Shipping): Navigates to legal pages.
  - WhatsApp CTA: Opens `https://wa.me/...` deep link in new tab.
- **Accessibility**: Semantic `<footer>` tag, accessible link labels.

### 2.4 Sitewide Active Order Status Banner (`components/storefront/ActiveOrderStatusBanner.tsx`)
- **Purpose**: Fixed top notification banner displayed to returning customer browsers with an active paid order in flight.
- **Data Dependencies**:
  - Calls `GET /api/orders/active-status` on mount (uses HttpOnly `active_order_session` cookie signed with `ORDER_SESSION_SECRET`).
  - Response Shape: `{ success: boolean, active: boolean, data?: { receiptNumber: string, orderStatus: string } }`.
- **User Actions**:
  - "Track Order" Button: Navigates to `/orders/track?receiptNumber=...`.
  - Dismiss Button (`X`): Calls `setDismissed(true)`, hiding banner for current session.
- **States**:
  - Hidden / Inactive: `activeOrder === null` or `dismissed === true` (renders `null`).
  - Active Banner: Renders dark banner (`#141414`) with orange badge, order receipt number, mapped status label ("Baking & Processing", "Packaging", "Out for Delivery"), and Track button.
- **Accessibility**: Keyboard dismissible button (`aria-label="Dismiss banner"`).

### 2.5 Local Business Structured Data (`components/storefront/LocalBusinessSchema.tsx`)
- **Purpose**: Headless component injecting Schema.org `Bakery` / `LocalBusiness` JSON-LD for Local SEO.
- **Data Dependencies**: Static shop schema (geo coordinates `19.094696, 72.896952`, opening hours, address).
- **User Actions**: None (headless).

---

## 3. Storefront Pages & Components

### 3.1 Homepage (`app/page.tsx` & `components/storefront/HomePageClient.tsx`)
- **Purpose**: Storefront landing page showcasing hero cake banner, category selection cards, featured products grid, flavor filter pills, and local bakery trust badges.
- **Data Dependencies**:
  - Calls `GET /api/products/public` (returns list of active products with variants, category, flavor, images, and `isFeatured` flag).
  - Calls `GET /api/flavors/public` (returns flavor list).
  - Calls `GET /api/cart` (returns current cart state).
- **User Actions & Handlers**:
  - "Order Cakes Now" CTA: Navigates to `/categories/cakes`.
  - "Custom Design Cakes" CTA: Navigates to `/custom-cakes`.
  - Category Cards ("Birthday Cakes", "Celebration Products"): Navigate to category pages.
  - Flavor Filter Pills: Sets `selectedFlavor` state to filter product grid.
  - Product Card "Quick Add": Calls `POST /api/cart` (`{ variantId, quantity: 1 }`), opens `CartDrawer` on success.
- **States**:
  - Loading State: Displays "Loading cakes & products...".
  - Empty Product Grid: Displays "No products found matching flavor [X]".
  - Hero Featured Product Display: Resolves featured cake with ImageKit optimization (`w-600,h-600,q-85,f-auto`).
- **Third-Party Integration**: ImageKit URL optimization via `getOptimizedImageUrl()`.

### 3.2 Product Card (`components/storefront/ProductCard.tsx`)
- **Purpose**: Reusable card component displaying product image, eggless badge, name, flavor tag, starting price, variant selector preview, and Quick Add button.
- **Data Dependencies**:
  - Props: `product: ProductData`, `onQuickAdd: (variantId: string) => void`.
- **User Actions**:
  - Card Image / Title Link: Navigates to `/products/[slug]`.
  - Variant Selector Dropdown: Switches selected variant weight/price.
  - "Quick Add" Button: Calls `onQuickAdd(selectedVariant.id)`. Disabled if variant out of stock.
- **States**:
  - Available / In-Stock: Active Quick Add button showing `₹[price]`.
  - Out of Stock: Variant disabled, Quick Add button disabled showing "Out of Stock" in red (`--state-error`).
  - Image Fallback: Primary image resolved via `getFirstProductImage()` with client `<img onError>` fallback to `/placeholder-cake.jpg`.
- **Accessibility**: Keyboard operable dropdown and button.

### 3.3 Category / Subcategory Listing Page (`app/categories/[slug]/page.tsx` & `CategoryListingClient.tsx`)
- **Purpose**: Dynamic category browse page supporting top-level subcategory cards (e.g. Cakes → Birthday Cakes, Anniversary Cakes) and subcategory product listing grids with flavor filters and keyword search.
- **Data Dependencies**:
  - Route param: `slug` (`cakes`, `celebration`, `birthday-cakes`, etc.).
  - Calls `GET /api/categories/public`, `GET /api/flavors/public`, `GET /api/products/public`, `GET /api/cart`.
- **User Actions**:
  - Subcategory Card Click: Navigates to subcategory page `/categories/[sub-slug]`.
  - Search Input: Filters product list by product name or description.
  - Flavor Filter Pills: Filters products by flavor.
  - Quick Add to Cart: Calls `POST /api/cart`.
- **States**:
  - Top-Level Category View (e.g., `/categories/cakes`): Displays Subcategory Cards grid.
  - Subcategory View (e.g., `/categories/birthday-cakes`): Displays filter bar, search input, two-level breadcrumbs (`Home > Cakes > Birthday Cakes`), and product grid.
  - Category Not Found: Displays "Category Not Found" guidance card with link back to shop.
  - No Matching Products: Displays empty state card ("No products found matching your filter").
- **Accessibility**: Accessible search input (`aria-label="Search products"`), breadcrumb trail (`aria-label="Breadcrumb"`).

### 3.4 Search Page (`app/search/page.tsx` & `SearchClient.tsx`)
- **Purpose**: Dedicated search page reading `?q=` query param, providing real-time text filtering and flavor filter pills across all active products.
- **Data Dependencies**:
  - Search param `q` from URL.
  - Calls `GET /api/products/public`, `GET /api/flavors/public`, `GET /api/cart`.
- **User Actions**: Search input typing, flavor pill selection, Quick Add to cart.
- **States**: Loading, empty query state ("Enter a search term..."), no results state, product results grid.

### 3.5 Product Detail Page (PDP) (`app/products/[slug]/page.tsx` & `ProductDetailClient.tsx`)
- **Purpose**: Full product detail page featuring ImageKit image gallery, variant selection (weight/price), available live stock calculation, quantity selector, add-to-cart, eggless guarantee badge, and SEO content block.
- **Data Dependencies**:
  - Route param: `slug`.
  - Calls `GET /api/products/public/[slug]` (`export const dynamic = 'force-dynamic'`, uncached live DB query).
  - Calls `GET /api/cart`.
- **User Actions & Handlers**:
  - Thumbnail Click: Switches main gallery image view.
  - Variant Pill Click: Selects active variant, updates displayed price and stock count.
  - Quantity Increment/Decrement: Adjusts quantity (clamped between 1 and available stock).
  - "Add to Cart" Button: Calls `POST /api/cart` (`{ variantId, quantity }`), opens cart drawer on success. Disabled while submitting or when out of stock.
- **States**:
  - Live Available Stock Display: Computes `availableStock = Math.max(0, stockQuantity - reservedQuantity)`.
  - In Stock State: Shows green badge ("In Stock ([N] left)"), active Add to Cart button.
  - Out of Stock State: Shows red badge ("Out of Stock"), disables Add to Cart button and quantity controls.
  - Product Soft-Deleted / Deleted: API returns 404, page renders "Product Not Found" card.
- **Third-Party Integration**: Gallery images transformed via ImageKit `getOptimizedImageUrl(src, { width: 800, height: 800, quality: 85 })`.
- **Accessibility**: ARIA group for variant selector pills (`role="radiogroup"`), quantity control labels.

### 3.6 Cart Drawer (`components/storefront/CartDrawer.tsx`)
- **Purpose**: Slide-over cart panel displaying item list, image thumbnails, variant labels, live calculated prices, item totals, quantity adjusters, subtotal, and Checkout CTA.
- **Data Dependencies**:
  - Props: `isOpen: boolean`, `onClose: () => void`, `cart: CartData`, `onUpdateQuantity`, `onRemoveItem`.
- **User Actions**:
  - Quantity `+` / `-` Buttons: Calls `onUpdateQuantity(variantId, newQty)`.
  - Trash / Remove Icon: Calls `onRemoveItem(variantId)`.
  - "Proceed to Checkout" Button: Navigates to `/checkout`, closes drawer.
- **States**:
  - Drawer Hidden (`isOpen === false`).
  - Drawer Visible (`isOpen === true` with backdrop overlay).
  - Empty Cart: Renders empty cart icon, "Your cart is empty", and "Browse Cakes" button.
  - Price/Stock Clamping: Server validates live DB prices and stock on every request; out-of-stock cart items render with "Unavailable" warning tag.
- **Accessibility**: Traps focus inside drawer when open, Esc key closes drawer, `aria-label="Shopping Cart"`.

---

## 4. Checkout & Fulfillment Flow

### 4.1 Checkout Page (`app/checkout/page.tsx`)
- **Purpose**: Step-by-step guest checkout flow handling customer details double-entry phone validation, 5 km delivery radius geocoding check, time slot selection, pre-submission review screen, Razorpay modal payment launch, and shop-closed blocking.
- **Data Dependencies**:
  - Calls `GET /api/cart` (validates cart is non-empty).
  - Calls `POST /api/checkout/validate-address` (Google Geocoding API + Haversine distance calculation).
  - Calls `POST /api/checkout/create-payment-order` (creates Razorpay payment order & atomic DB stock reservation via `reserveStockAtomic`).
  - Dynamic Script: Loads `https://checkout.razorpay.com/v1/checkout.js`.
- **User Actions & Handlers**:
  - Address Input + "Verify Delivery Distance": Calls `POST /api/checkout/validate-address`. Blocked if address outside 5 km radius.
  - Form Submit / "Continue to Order Review": Validates phone numbers match (`phone === confirmPhone`), phone format (`10 digits`), email format, address radius verified.
  - "Edit Order Details" Button: Returns from review screen to form step.
  - "Proceed to Pay" Button: Calls `POST /api/checkout/create-payment-order`, launches Razorpay Checkout modal widget.
- **States**:
  - Empty Cart Access: Redirects to `/`.
  - Shop Closed State: If shop `isOpen === false`, checkout form is replaced with a warning modal ("Velvet Crumb Bakery is currently closed for orders").
  - Address Validation States:
    - Unchecked / Idle.
    - Loading ("Checking delivery distance...").
    - Verified Within Radius (Green banner: "Delivery available! Address is within 5 km radius").
    - Outside Radius (Red error banner: "Delivery Unavailable: Address is outside our 5 km delivery radius").
  - Phone Mismatch Error: Red message ("Mobile numbers do not match").
  - Review Screen State: Hides edit form, displays summary card with pre-payment warning ("We will contact you at [number] to confirm details").
  - Payment In-Flight State: Sets `isConfirmingPayment = true` on Razorpay payment success callback, displaying `PaymentProcessingOverlay`.
- **Third-Party Integration**:
  - **Google Maps Geocoding API**: Validates address within Mumbai bounds (`18.89,72.75|19.30,73.10`).
  - **Razorpay Checkout Modal**: Mounted via `new window.Razorpay(options).open()`.
- **Accessibility**: Step progress indicators, form field labels, error alert region (`role="alert"`).

### 4.2 Payment Processing Overlay (`components/storefront/PaymentProcessingOverlay.tsx`)
- **Purpose**: Full-screen modal overlay displayed immediately upon Razorpay payment completion while server webhook payment confirmation and receipt generation process in background.
- **Data Dependencies**: Props: `isVisible: boolean`, `title?: string`, `message?: string`.
- **User Actions**: Registers window `beforeunload` event listener while `isVisible === true`.
- **States**:
  - Hidden (`isVisible === false`).
  - Visible: Fixed dark backdrop (`bg-[#141414]/70 backdrop-blur-md`), elevated card with spinning orange ring, `ShieldCheck` icon, security warning ("Please do not close or refresh this page..."), and `beforeunload` browser prompt if user attempts to navigate away.

---

## 5. Post-Order, Tracking & Legal Pages

### 5.1 Order Confirmation & PDF Invoice Page (`app/orders/[receiptNumber]/page.tsx`)
- **Purpose**: Customer order confirmation page displaying receipt number, order status timeline, delivery details, ordered items summary, WhatsApp confirmation deep link, and Download PDF Invoice CTA.
- **Data Dependencies**:
  - Route param: `receiptNumber`.
  - Calls `GET /api/orders/public?receiptNumber=...` (polls up to 5 times at 1s intervals if order pending).
  - Download Invoice: Calls `GET /api/orders/[id]/invoice` (requires `paymentStatus === 'SUCCESS'` and valid signed `active_order_session` cookie or matching phone).
- **User Actions**:
  - "Download PDF Invoice": Downloads generated PDF invoice.
  - "Confirm Order on WhatsApp": Opens `https://wa.me/...` deep link with pre-filled receipt message.
  - "Track Order Status": Navigates to `/orders/track`.
- **States**:
  - Polling State: Polling `GET /api/orders/public` for up to 5 seconds after payment redirect.
  - Confirmed Order Display: Displays receipt card, item table, and active status step.
  - Pending / Payment Confirmation Delay Card: Displayed if polling times out before webhook processes.

### 5.2 Order Tracking Page (`app/orders/track/page.tsx` & `OrderTrackingClient.tsx`)
- **Purpose**: Two-factor customer order status lookup page requiring receipt number and phone number, rendering a 5-stage progress timeline (Order Received → Processing → Packaging → Out for Delivery → Delivered).
- **Data Dependencies**:
  - Query params: `?receiptNumber=...`.
  - Calls `POST /api/orders/track` (`{ receiptNumber, phone }`).
- **User Actions**: Form submission with receipt number and phone number inputs.
- **States**:
  - Idle / Initial Form View.
  - Submitting State: Submit button disabled showing "Searching Order...".
  - Tracked Order View: Renders 5-stage timeline card:
    - Stages prior to current: Labeled "Completed" with green checkicon.
    - Active non-terminal stage: Labeled "In Progress" with orange pulse indicator.
    - Terminal `DELIVERED` stage: Labeled "Completed" when active (Fix-14 label correction).
  - Generic 404 Error State: Displays uniform error message ("No matching order found for the provided receipt number and phone number") for both incorrect lookup credentials AND 1-hour post-delivery auto-expired orders (Fix tracking auto-expiry).
- **Security & Privacy Rule**: Once an order reaches `DELIVERED` status, tracking lookups automatically return the generic 404 error 1 hour after the delivery timestamp to protect customer privacy.

### 5.3 Custom Cakes Page (`app/custom-cakes/page.tsx` & `CustomCakesClient.tsx`)
- **Purpose**: Static informational page explaining custom cake ordering options (fondant, tiered, custom themes) with direct WhatsApp CTA button (no in-site custom order form).
- **Data Dependencies**: None (static text + WhatsApp number from settings).
- **User Actions**: "Order Custom Cake on WhatsApp" button opens `https://wa.me/919999900000` with pre-filled message.

### 5.4 Legal Pages
- **Pages**:
  - `/privacy-policy` (`app/privacy-policy/page.tsx`)
  - `/terms-conditions` (`app/terms-conditions/page.tsx`)
  - `/return-refund-policy` (`app/return-refund-policy/page.tsx`)
  - `/shipping-policy` (`app/shipping-policy/page.tsx`)
- **Purpose**: Compliance and legal information pages for local e-commerce operation.
- **Data Dependencies**: Static markdown content formatted with clean typography.

---

## 6. Admin Panel

### 6.1 Admin Login Page (`app/admin/login/page.tsx`)
- **Purpose**: Secure admin login page for single shop administrator.
- **Data Dependencies**: Calls `POST /api/admin/login` (`{ email, password }`).
- **User Actions**: Form submit with email and password inputs.
- **States**:
  - Idle / Form View.
  - Submitting State: Covered by `LoadingOverlay` ("Authenticating credentials..."), submit button disabled.
  - Error State: Displays red error banner (e.g. "Invalid credentials" or "Too many login attempts. Account temporarily locked for 15 minutes" via database-backed rate limiting).
  - Success State: Redirects to `/admin/dashboard`.

### 6.2 Admin Dashboard Layout & Page (`app/admin/dashboard/page.tsx`)
- **Purpose**: Unified control panel for shop owner to manage Products, Categories, Flavors, Orders, Shop Settings, and Audit Logs.
- **Data Dependencies**:
  - Calls `GET /api/admin/products`, `GET /api/admin/categories`, `GET /api/admin/flavors`, `GET /api/admin/orders`, `GET /api/admin/shop-settings`, `GET /api/admin/me`.
- **UI Sections & Tabs**:
  1. **Header & Navigation Bar**: Displays shop name, admin email, Shop Open/Closed status pill, Logout button.
  2. **Tab Switcher**: Products | Categories | Flavors | Orders | Shop Settings | Audit Logs.
  3. **Product Management Tab**:
     - Client-side search input (by product name/slug).
     - Subcategory filter dropdown.
     - Product List Table: Image thumbnail, name, subcategory, flavor, price range, stock levels, active/deleted status, Edit button, Soft Delete button.
     - Product Create / Edit Modal: Product name, slug, subcategory dropdown, flavor dropdown, description, SEO title/description, ImageKit upload UI (thumbnail grid, upload button, remove controls), Dynamic Multi-Variant Manager (add/remove weight rows e.g. 500g, 1kg, price, stock quantity).
  4. **Category & Subcategory Management Tab**:
     - Category List Tree: Top-level categories ("Cakes", "Celebration Products") and child subcategories.
     - Add Category Form: Category name, slug, category type (`CAKE` / `CELEBRATION`), parent category dropdown (`parentId: null` for top-level, or select parent for subcategory).
     - Category Delete Action: Enforces category deletion protection pre-check (blocks deletion with friendly warning if referenced by active subcategories or ANY active/soft-deleted products).
  5. **Flavor Management Tab**:
     - Flavor List Table: Flavor name, product usage count badge (`used by N product(s)`), inline Edit action (rename flavor live), Delete action.
     - Delete Action: Prompts admin confirmation if used by 1+ products; deletion sets `flavorId: null` atomically on products via `onDelete: SetNull`.
  6. **Order Management Tab**:
     - Status Filter Tabs: `ALL` | `SUCCESS` (Default) | `PENDING` | `FAILED` | `CANCELLED` | `EXPIRED`.
     - Order List Table: Receipt number, customer name, mobile, delivery slot, total amount, payment status badge, order status dropdown (`ORDER_RECEIVED` → `PROCESSING` → `PACKAGING` → `OUT_FOR_DELIVERY` → `DELIVERED`), Manual Cancel Order button.
     - Cancel Order Modal: Releases reserved stock back to inventory via `releaseOrderReservation` and records audit log.
  7. **Shop Settings Tab**:
     - Shop Open/Closed Toggle Switch.
     - Shop Hours, Contact Email, WhatsApp Number, Delivery Radius (5 km), Bakery Address, Shop Geocode Coordinates (`19.094696, 72.896952`).
  8. **Audit Logs Tab**: Data table of admin login attempts, price/stock edits, product soft-deletes, shop status toggles.
- **States & Protections**:
  - All admin server mutations wrap their form/table sections with `LoadingOverlay` (`components/admin/LoadingOverlay.tsx`) to prevent double-click submissions (Fix-08).
  - File upload route (`/api/admin/upload`) enforces magic-byte file signature validation (JPEG, PNG, WEBP, GIF) and 5 MB size limit.
  - Rate limited per admin session (`upload_admin_${session.adminId}`).

### 6.3 Admin Loading Overlay (`components/admin/LoadingOverlay.tsx`)
- **Purpose**: Translucent backdrop overlay with spinner and label used across all admin server actions.
- **Data Dependencies**: Props: `isLoading: boolean`, `message?: string`, `className?: string`, `children?: React.ReactNode`.
- **States**:
  - Inactive (`isLoading === false`): Renders `children` normally.
  - Active (`isLoading === true`): Renders `children` overlaid with `bg-[#141414]/40 backdrop-blur-[1.5px]`, white card container, `--accent-primary` (`#F0791A`) spinner, and `--text-primary` (`#1B1F3B`) message label. Blocks pointer events on underlying form controls.
