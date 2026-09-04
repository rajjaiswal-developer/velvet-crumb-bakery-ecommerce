# Velvet Crumb Bakery — Full-Stack E-Commerce & Bakery Operations Platform

A modern, full-stack e-commerce and storefront management application built for high-performance online ordering, custom cake requests, real-time inventory tracking, payment gateway integration, and administrative operations.

![Next.js](https://img.shields.io/badge/Next.js-14_App_Router-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Prisma_ORM-336791?style=for-the-badge&logo=postgresql)
![Razorpay](https://img.shields.io/badge/Razorpay-Payment_Gateway-blueviolet?style=for-the-badge&logo=razorpay)

---

## 🌐 Live Demo

**Live Website:** [https://velvet-crumb-bakery-ecommerce...](https://velvet-crumb-bakery-ecommerce.vercel.app/)

---

## Key Features

### 🛍️ Customer Storefront & Catalog
- **Dynamic Product Showcase**: Browsable cake catalog with real-time stock status, dietary tags (100% Vegetarian / Eggless), category navigation, and flavor filtering.
- **Custom Cake Inquiry Workflow**: Dedicated custom cake order form integrated with instant messaging links and custom specification fields.
- **Responsive Media & Design**: Optimized image delivery powered by ImageKit, brand color themes, micro-animations, and structured Schema.org JSON-LD data for SEO.

### 🛒 Cart, Checkout & Address Validation
- **Real-Time Stock Reservation**: Atomic inventory reservations during checkout to prevent double-booking or overselling of limited products.
- **Serviceable Delivery Radius Check**: Integrated location validation ensuring customer shipping addresses fall within the 5 km delivery radius.
- **Seamless Payment Integration**: Full integration with Razorpay Payment Gateway supporting card, UPI, and net-banking transactions.

### 🚚 Live Order Status & Tracking
- **Sitewide Order Status Banner**: Signed, HttpOnly session banner notifying active customers of payment success and real-time fulfillment status.
- **Multi-Factor Order Tracking**: Customer order tracking page requiring receipt number and phone number verification.
- **Automated Transactional Receipts**: Instant email notification dispatching HTML receipts via Brevo REST API.

### 🔐 Administrative Dashboard & Backoffice Operations
- **Product & Variant Management**: Full CRUD dashboard for products, weight-based variants, and custom pricing, with soft-deletion and permanent deletion safety guards.
- **Category & Flavor Hierarchy**: Management of top-level categories, subcategories, and flavor associations.
- **Order Management & Real-Time Polling**: Live admin dashboard featuring page-indexed order lists, audio alerts for new paid orders, and order status progression (Received → Baking → Out for Delivery → Delivered).
- **Serviceable Delivery Area CRUD**: Administrative control over active delivery zones and locality selections.
- **Audit Logging**: Comprehensive internal audit logger tracking critical administrative updates and system events.

---

## 🛠️ Technology Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, Server Components, Route Handlers)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & CSS Modules
- **Database & ORM**: [PostgreSQL](https://www.postgresql.org/) managed via [Prisma ORM](https://www.prisma.io/)
- **State & Data Validation**: [Zod](https://zod.dev/) for server-side schema validation
- **Authentication & Security**: JOSE JWT signed HttpOnly cookies, bcrypt password hashing, and custom middleware guards
- **Payments**: [Razorpay API](https://razorpay.com/)
- **Media Storage**: [ImageKit.io](https://imagekit.io/) CDN
- **Email Dispatch**: [Brevo REST API](https://www.brevo.com/) (Sendinblue)

---

## 🏗️ Architecture & Security Highlights

1. **Database Connection Pooling**: Built for serverless environments utilizing connection pooling (`pgbouncer`) to ensure low-latency query execution.
2. **Domain-Isolated JWT Sessions**: Independent signing secrets and cookie scopes for admin sessions, order status banners, and active customer carts.
3. **Data Integrity Guards**: Soft-deletion patterns on catalog entities prevent orphaned foreign key references, paired with database jsonb containment checks for permanent deletion of unused legacy items.
4. **Hardened Security Headers**: Content Security Policy (CSP), HTTP Strict Transport Security (HSTS), rate limiting, and binary magic-byte validation on media uploads.

---

## 📁 Project Structure

```text
├── app/                  # Next.js 14 App Router (Pages, Layouts, API Routes)
│   ├── (admin)/          # Protected Admin Dashboard routes & UI
│   ├── api/              # Secure REST API Endpoints (Admin, Storefront, Checkout, Cron)
│   ├── checkout/         # Multi-step checkout & address validation page
│   ├── orders/           # Customer order tracking page
│   └── page.tsx          # Storefront homepage
├── components/           # Reusable UI & Storefront components
│   ├── admin/            # Backoffice data tables, modal forms & status chips
│   └── storefront/       # Navigation, Product grids, Hero carousel & Cart drawer
├── lib/                  # Shared utilities, hooks, database client & auth models
│   ├── auth/             # JWT session generation & cookie parsing
│   ├── hooks/            # Decoupled custom React hooks for business logic
│   └── prisma.ts         # Prisma DB client singleton instance
├── prisma/               # Database Schema, Migrations & Seeding scripts
│   ├── migrations/       # SQL migration history
│   └── schema.prisma     # Prisma Data Model definitions
├── public/               # Static assets & brand media
└── scripts/              # Verification & maintenance utilities
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18.17.0 or higher
- **Package Manager**: npm (v9+) or yarn / pnpm
- **Database**: PostgreSQL instance (Neon, Supabase, or local PostgreSQL)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/velvet-crumb-bakery-ecommerce.git
cd velvet-crumb-bakery-ecommerce
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a local `.env` file by copying the template provided in `.env.example`:

```bash
cp .env.example .env
```

Update the values in `.env` with your PostgreSQL database URL, Razorpay keys, ImageKit credentials, and JWT secret keys.

### 4. Database Setup & Seeding

Run Prisma migrations to set up the database schema:

```bash
npx prisma migrate dev
```

(Optional) Seed the database with initial demo catalog data:

```bash
npx prisma db seed
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## 🧪 Build & Verification

To test the production build locally:

```bash
npm run build
npm run start
```

---

## 📄 License

This repository is maintained as a full-stack portfolio application. All rights reserved.
