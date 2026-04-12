
# ============================================================
# AGENT MODE — FULL-STACK E-COMMERCE DASHBOARD
# ============================================================

GOAL:
Build a production-ready, full-stack e-commerce admin dashboard using the following strict tech stack and design system. Do NOT deviate from these choices.

TECH STACK (MANDATORY):
- Framework    : Next.js 14 with App Router (TypeScript)
- Styling       : Tailwind CSS v3 + custom CSS variables
- Animation     : Framer Motion
- Database      : Neon (serverless PostgreSQL) via @neondatabase/serverless
- ORM           : Drizzle ORM
- Auth          : NextAuth.js v5 (beta) with Credentials provider
- Media/Upload  : Cloudinary (next-cloudinary package)
- Icons         : lucide-react only
- Charts        : recharts

DESIGN SYSTEM — GLASS MORPHISM (STRICT):
Primary theme is DARK MODE with soft muted tones (NOT neon/harsh).
Light mode uses soft blue palette.

CSS variables to define in globals.css:
  --bg-base: #0f1117          /* dark: near-black with blue tint */
  --bg-surface: #161b27       /* card background */
  --bg-glass: rgba(22,27,39,0.6)
  --glass-border: rgba(255,255,255,0.08)
  --glass-blur: 16px
  --accent-blue: #4A90D9      /* soft blue — NOT electric */
  --accent-teal: #2DD4BF
  --accent-purple: #8B7CF6
  --text-primary: #E8EAF0
  --text-muted: #7C8DB0
  --sidebar-w: 260px

Glass card mixin (apply to all cards/panels):
  background: var(--bg-glass)
  backdrop-filter: blur(var(--glass-blur))
  border: 1px solid var(--glass-border)
  border-radius: 16px

Light mode (.light class on html):
  --bg-base: #EBF3FD
  --bg-surface: #FFFFFF
  --bg-glass: rgba(255,255,255,0.65)
  --glass-border: rgba(74,144,217,0.15)
  --text-primary: #1A2540
  --text-muted: #5B6E8C

SIDEBAR STRUCTURE (nested menus):
Build a collapsible sidebar (260px wide, collapses to 64px on mobile).
Menu items with children use accordion expand. Structure:

  Dashboard (icon: LayoutDashboard) — /dashboard
  
  Users (icon: Users)
    ├── All Users          — /dashboard/users
    ├── Roles & Permissions — /dashboard/users/roles
    └── Activity Log       — /dashboard/users/activity
  
  Products (icon: Package)
    ├── All Products       — /dashboard/products
    ├── Categories         — /dashboard/products/categories
    └── Inventory          — /dashboard/products/inventory
  
  Orders (icon: ShoppingCart)
    ├── All Orders         — /dashboard/orders
    ├── Pending            — /dashboard/orders/pending
    └── Returns            — /dashboard/orders/returns
  
  Analytics (icon: BarChart2)
    ├── Overview           — /dashboard/analytics
    ├── Revenue            — /dashboard/analytics/revenue
    └── Traffic            — /dashboard/analytics/traffic
  
  Media (icon: Image)
    ├── Upload             — /dashboard/media/upload
    └── Library            — /dashboard/media/library
  
  Settings (icon: Settings)
    ├── General            — /dashboard/settings
    ├── Profile            — /dashboard/settings/profile
    └── Integrations       — /dashboard/settings/integrations

PAGES TO BUILD (each must be functional):

1. /dashboard — Overview page
   - Stats cards: Total Revenue, Total Orders, Total Users, Active Products
   - Revenue chart (recharts AreaChart, last 30 days)
   - Recent orders table (last 5 orders from DB)
   - Top products list

2. /dashboard/users — Users management
   - Table with: avatar (Cloudinary), name, email, role, status, joined date
   - Search + filter by role/status
   - CRUD: create user modal, edit, soft-delete
   - Pagination (server-side, Neon query)

3. /dashboard/products — Products management
   - Product grid + list toggle
   - Each product: image (Cloudinary), name, category, price, stock, status
   - CRUD with image upload via Cloudinary
   - Filter by category, search by name

4. /dashboard/orders — Orders management
   - Orders table: order ID, customer, items, total, status badge, date
   - Status filter: All / Pending / Processing / Shipped / Delivered / Returned
   - Order detail modal/drawer

5. /dashboard/analytics — Analytics
   - Revenue area chart (monthly)
   - Orders bar chart (weekly)
   - Top 5 products donut chart
   - Traffic stats cards (recharts)

6. /dashboard/media/upload — Media upload
   - Drag-and-drop upload zone using next-cloudinary CldUploadWidget
   - Preview uploaded images
   - Store Cloudinary URLs to Neon DB (media table)

7. /dashboard/media/library — Media library
   - Grid of uploaded images from DB
   - Click to copy URL
   - Delete (remove from DB, optionally from Cloudinary)

8. /dashboard/settings/profile — Profile settings
   - Edit name, email, avatar (Cloudinary upload)
   - Change password form
   - Save to DB via server action

DATABASE SCHEMA (prisma + Neon):
Create schema in /src/db/schema.ts:

  users: id, name, email, password_hash, role (admin|staff|viewer),
         avatar_url, status (active|inactive), created_at

  products: id, name, slug, description, price, stock, category_id,
            image_url, status (active|draft|archived), created_at

  categories: id, name, slug, description

  orders: id, user_id, status, total, created_at

  order_items: id, order_id, product_id, quantity, price

  media: id, url, public_id, filename, size, uploaded_by, created_at

Migrations via: drizzle-kit push

API ROUTES (Route Handlers in /src/app/api/):
  GET/POST   /api/users
  GET/PUT/DELETE /api/users/[id]
  GET/POST   /api/products
  GET/PUT/DELETE /api/products/[id]
  GET        /api/orders
  GET/PUT    /api/orders/[id]
  GET/POST/DELETE /api/media
  GET        /api/analytics/revenue
  GET        /api/analytics/orders

LAYOUT REQUIREMENTS:
- /src/app/dashboard/layout.tsx — wraps all dashboard pages
  Contains: Sidebar + Topbar + main content area
- Topbar: breadcrumb, theme toggle (dark/light), user avatar dropdown
- Sidebar: logo, nav items with icons, active state highlight, logout
- Mobile: sidebar becomes bottom sheet / hamburger overlay
- Smooth Framer Motion transitions between pages (page slide-in)

CLOUDINARY SETUP:
- Use next-cloudinary package
- CldImage for optimized image display
- CldUploadWidget for uploads (unsigned preset: "dashboard_uploads")
- Store public_id and secure_url in Neon DB after each upload
- Create upload preset in Cloudinary dashboard (unsigned mode)

AUTH SETUP:
- NextAuth v5 with Credentials provider
- Session stored in JWT
- Middleware: protect all /dashboard/* routes
- Login page at /login with glass card form
- Role-based access: admin sees all, staff limited, viewer read-only

ENVIRONMENT VARIABLES NEEDED:
  DATABASE_URL          — Neon connection string
  NEXTAUTH_SECRET       — random 32-char string
  NEXTAUTH_URL          — http://localhost:3000
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  CLOUDINARY_API_KEY
  CLOUDINARY_API_SECRET
  NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=dashboard_uploads

PACKAGE INSTALL COMMAND:
npm install next-auth@beta @neondatabase/serverless drizzle-orm drizzle-kit next-cloudinary cloudinary framer-motion recharts lucide-react @auth/drizzle-adapter

EXECUTION ORDER FOR AGENT:
1. Scaffold Next.js project (already done or: npx create-next-app@latest)
2. Install all dependencies
3. Setup .env.local with all variables
4. Create /src/db/schema.ts and /src/db/index.ts (Neon + Drizzle client)
5. Run drizzle-kit push to create tables in Neon
6. Create globals.css with all CSS variables and glass utilities
7. Build layout: Sidebar component → Topbar → Dashboard layout
8. Build all pages in order listed above
9. Build all API route handlers
10. Setup NextAuth with middleware
11. Seed DB with sample data (10 users, 20 products, 30 orders)
12. Test all CRUD operations
13. Verify mobile responsiveness

QUALITY CHECKLIST:
✓ All pages fully typed (TypeScript, no 'any')
✓ Loading states on all async operations (skeleton UI)
✓ Error boundaries on each page
✓ Mobile responsive (breakpoint: md=768px)
✓ Dark/light mode toggle persists in localStorage
✓ All DB queries use parameterized statements (no SQL injection)
✓ Images always use CldImage (never raw img for Cloudinary assets)
✓ Sidebar active state matches current pathname
✓ Empty states for tables with no data

# ============================================================
# START: Begin with Step 1 and proceed sequentially.
# Ask for clarification ONLY if a .env value is missing.
# ============================================================