# UI Context

## Theme

The brand identity (from Velvet Crumb Bakery' logo, banners, and catalog) is
a premium, warm bakery aesthetic: a vivid orange/gold primary palette
against either a light cream storefront surface or a dark
navy/black "showcase" surface (as seen in the hero/landing reference
mockup). The site should feel warm and celebratory, not sterile or
generic e-commerce. Two surface modes, not light/dark theming in the
UI-toggle sense:

- **Storefront (default)**: warm cream/white background, orange and
  navy accents — approachable, easy to shop.
- **Hero/showcase sections** (homepage banner, featured product):
  dark navy/black background with gold/orange accents — matches the
  premium landing reference mockup.

## Colors

Approximate values extracted from the provided brand assets —
**confirm exact hex codes with the client or their design files
before finalizing.**

| Role              | CSS Variable        | Value (approx.) |
| ------------------ | -------------------- | ---------------- |
| Page background     | `--bg-base`          | `#FFF8F0` |
| Dark showcase bg     | `--bg-showcase`      | `#141414` |
| Surface / card       | `--bg-surface`       | `#FFFFFF` |
| Primary text         | `--text-primary`     | `#1B1F3B` (navy) |
| Muted text           | `--text-muted`       | `#6B6B6B` |
| Primary accent (orange) | `--accent-primary` | `#F0791A` |
| Secondary accent (gold) | `--accent-secondary` | `#C9A24B` |
| Border               | `--border-default`   | `#E8DCCB` |
| Error                | `--state-error`      | `#D14343` |
| Success              | `--state-success`    | `#3F9142` |

## Typography

| Role         | Font                                  | Variable       |
| ------------ | -------------------------------------- | -------------- |
| Display / headings | Elegant serif (matches "Velvet Crumb Bakery" logotype, e.g. Playfair Display) | `--font-display` |
| Body / UI text      | Clean sans-serif (e.g. Jost, per existing tech-stack usage) | `--font-sans` |

## Border Radius

| Context            | Class            |
| ------------------- | ---------------- |
| Inline / small UI    | `rounded-md`     |
| Cards / product tiles| `rounded-xl`     |
| Modals / overlays    | `rounded-2xl`    |

## Component Library

Tailwind CSS with shadcn/ui components where useful (forms, modals,
toasts for the admin panel and checkout flow). Custom-styled product
cards, hero sections, and catalog grids for the storefront to match
the brand's illustrative/photographic style — avoid generic
templated e-commerce card layouts.

## Layout Patterns

- **Homepage**: full-width dark showcase hero (featured cake,
  tagline, primary CTA) → category grid → best-sellers/featured
  strip → local-trust section (delivery radius, ratings, since-2018)
  → footer with contact/WhatsApp.
- **Category/product listing**: left/top filter bar (flavor, search)
  + responsive product grid.
- **Product detail**: image gallery, variant selector (weight/price),
  add-to-cart, description, SEO-friendly content block.
- **Checkout**: single-column, step-based (details → OTP → address/
  delivery validation → time slot → payment), progress indicator.
- **Admin panel**: fixed left sidebar navigation (Products, Orders,
  Categories/Flavors, Shop Status, Settings), main content area with
  data tables and forms — clean, modern CMS-style layout.
- **Modals**: centered overlay with backdrop blur (used for
  shop-closed notice, OTP entry, order confirmation).
- **Loading & Processing Overlays**:
  - **Admin Loading Overlay** (`components/admin/LoadingOverlay.tsx`): translucent dark backdrop (`bg-[#141414]/40 backdrop-blur-[1.5px]`), centered card with `--accent-primary` (`#F0791A`) spinner and `--text-primary` (`#1B1F3B`) message label. Applied to all admin server action forms to block double-click dispatches (Fix-08).
  - **Payment Processing Overlay** (`components/storefront/PaymentProcessingOverlay.tsx`): full-screen dark backdrop (`bg-[#141414]/70 backdrop-blur-md`), elevated card with dual-ring orange spinner, `ShieldCheck` badge, status messaging, and window `beforeunload` navigation guard. Displayed immediately upon Razorpay payment success callback while background webhook confirmation processes (Fix-15).

## Icons

Lucide React. Stroke-based icons only. Sizes: `h-4 w-4` for inline
use, `h-5 w-5` for buttons and nav items.
