# Ecommerce Platform Blueprint
## Complete Setup Guide — From Zero to Production

> **Stack:** Medusa.js v2 · SvelteKit · PostgreSQL · Redis · Meilisearch · Stripe · Cloudflare · Coolify
> **Cost:** €0–5/month | **Time estimate:** 40–60 hours for full implementation

---

## Table of Contents

1. [Prerequisites & Accounts](#1-prerequisites--accounts)
2. [Infrastructure Setup (Coolify + VPS)](#2-infrastructure-setup)
3. [Database & Cache Layer](#3-database--cache-layer)
4. [Medusa.js v2 Backend](#4-medusajs-v2-backend)
5. [Search Engine (Meilisearch)](#5-search-engine)
6. [SvelteKit Storefront](#6-sveltekit-storefront)
7. [Design System & UX Layer](#7-design-system--ux-layer)
8. [Authentication & Passwordless](#8-authentication--passwordless)
9. [Payments (Stripe)](#9-payments-stripe)
10. [Image Pipeline](#10-image-pipeline)
11. [Email System](#11-email-system)
12. [Security Hardening](#12-security-hardening)
13. [Performance Optimization](#13-performance-optimization)
14. [Analytics & Monitoring](#14-analytics--monitoring)
15. [CI/CD Pipeline](#15-cicd-pipeline)
16. [Domain & DNS (Cloudflare)](#16-domain--dns)
17. [Go-Live Checklist](#17-go-live-checklist)
18. [Maintenance & Operations](#18-maintenance--operations)

---

## 1. Prerequisites & Accounts

### 1.1 Sign Up for Free Accounts

Create accounts at each of these services before you begin. All have free tiers sufficient for this project.

| Service | URL | What You Need |
|---------|-----|---------------|
| **GitHub** | github.com | Repository hosting, CI/CD |
| **Hetzner** (or similar VPS) | hetzner.com | CX22 — 2 vCPU, 4GB RAM, 40GB SSD (~€4/mo) |
| **Cloudflare** | cloudflare.com | DNS, CDN, WAF, SSL |
| **Stripe** | stripe.com | Payment processing (test mode) |
| **Cloudinary** | cloudinary.com | Image hosting & optimization |
| **Resend** | resend.com | Transactional email (3k/mo free) |
| **Sentry** | sentry.io | Error tracking (5k events/mo free) |
| **Socket.dev** | socket.dev | Dependency security scanning |

### 1.2 Local Development Requirements

Install these on your development machine:

```bash
# Node.js 20+ (use fnm or nvm)
curl -fsSL https://fnm.vercel.app/install | bash
fnm install 20
fnm use 20

# pnpm (fast, disk-efficient package manager)
corepack enable
corepack prepare pnpm@latest --activate

# Docker & Docker Compose (for local services)
# macOS: Install Docker Desktop or OrbStack
# Linux: Follow official Docker install docs

# Git
git --version  # should be 2.40+

# Stripe CLI (for webhook testing)
brew install stripe/stripe-cli/stripe  # macOS
# Linux: download from https://stripe.com/docs/stripe-cli
```

### 1.3 Project Repository Setup

```bash
mkdir my-store && cd my-store
git init

# Create project structure
mkdir -p apps/storefront
mkdir -p apps/backend
mkdir -p infrastructure/{coolify,crowdsec,backups}
mkdir -p .github/workflows

# Root package.json for monorepo
cat > package.json << 'EOF'
{
  "name": "my-store",
  "private": true,
  "scripts": {
    "dev": "pnpm --filter './apps/**' run dev",
    "dev:backend": "pnpm --filter backend run dev",
    "dev:storefront": "pnpm --filter storefront run dev",
    "build": "pnpm --filter './apps/**' run build",
    "lint": "pnpm --filter './apps/**' run lint",
    "check": "pnpm --filter './apps/**' run check"
  }
}
EOF

# pnpm workspace config
cat > pnpm-workspace.yaml << 'EOF'
packages:
  - 'apps/*'
EOF

# .gitignore
cat > .gitignore << 'EOF'
node_modules/
.env
.env.*
!.env.example
dist/
build/
.svelte-kit/
.medusa/
.DS_Store
*.log
EOF

# Environment template
cat > .env.example << 'EOF'
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/medusa
REDIS_URL=redis://localhost:6379

# Medusa
MEDUSA_ADMIN_ONBOARDING_TYPE=nextjs
STORE_CORS=http://localhost:5173
ADMIN_CORS=http://localhost:9000
AUTH_CORS=http://localhost:5173,http://localhost:9000

# Stripe
STRIPE_API_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Resend
RESEND_API_KEY=re_...

# Meilisearch
MEILISEARCH_HOST=http://localhost:7700
MEILISEARCH_API_KEY=your-master-key

# Sentry
SENTRY_DSN=https://...@sentry.io/...

# App
PUBLIC_STORE_URL=http://localhost:5173
PUBLIC_MEDUSA_URL=http://localhost:9000
EOF

git add -A && git commit -m "Initial project structure"
```

---

## 2. Infrastructure Setup

### 2.1 VPS Initial Setup (Hetzner CX22)

After creating your Hetzner server with Ubuntu 24.04:

```bash
# SSH into your new server
ssh root@YOUR_SERVER_IP

# 2.1.1 — Create a non-root user
adduser deploy
usermod -aG sudo deploy

# 2.1.2 — SSH hardening
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys

# Disable root login and password auth
sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart sshd

# 2.1.3 — Firewall (UFW)
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable

# 2.1.4 — fail2ban (brute-force protection)
apt update && apt install -y fail2ban
cat > /etc/fail2ban/jail.local << 'FAIL2BAN'
[sshd]
enabled = true
port = 22
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
findtime = 600
FAIL2BAN
systemctl enable --now fail2ban

# 2.1.5 — Automatic security updates
apt install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades  # Select "Yes"

# 2.1.6 — Set timezone and hostname
timedatectl set-timezone UTC
hostnamectl set-hostname my-store
```

### 2.2 Install Coolify

Coolify is your self-hosted PaaS — it manages Docker containers, SSL certificates, databases, and deployments.

```bash
# Still logged in as root on your VPS
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

After installation:
1. Open `http://YOUR_SERVER_IP:8000` in your browser
2. Create your admin account
3. Go to **Settings → General** and set your domain (e.g., `coolify.yourdomain.com`)
4. Set up a **Wildcard Domain** for automatic SSL: `*.yourdomain.com`

### 2.3 Coolify: Create Services

In Coolify's dashboard, create the following resources. Each runs as a Docker container managed by Coolify.

#### PostgreSQL

- **Resources → New → Database → PostgreSQL**
- Version: 16
- Database name: `medusa`
- Username: `postgres`
- Generate a strong password — save it
- Port: 5432 (internal only, not exposed to internet)

#### Redis

- **Resources → New → Database → Redis**
- Version: 7
- Port: 6379 (internal only)

#### Meilisearch

- **Resources → New → Service → Docker Compose**
- Paste this docker-compose:

```yaml
version: '3.8'
services:
  meilisearch:
    image: getmeili/meilisearch:v1.7
    environment:
      - MEILI_MASTER_KEY=${SERVICE_PASSWORD_MEILI}
      - MEILI_ENV=production
      - MEILI_NO_ANALYTICS=true
    volumes:
      - meili_data:/meili_data
    ports:
      - "7700:7700"
volumes:
  meili_data:
```

- Set the `SERVICE_PASSWORD_MEILI` environment variable to a strong random string
- Domain: `search.yourdomain.com` (Coolify handles SSL)

---

## 3. Database & Cache Layer

### 3.1 Database Schema Design

Medusa v2 handles its own schema migrations, but understanding the core entities helps:

```
┌─────────────┐   ┌──────────────┐   ┌─────────────┐
│   Product    │──<│   Variant    │──<│  Price Set   │
│  - title     │   │  - sku       │   │  - amount    │
│  - handle    │   │  - inventory │   │  - currency  │
│  - status    │   │  - options   │   │  - region    │
└─────────────┘   └──────────────┘   └─────────────┘
       │
       │          ┌──────────────┐   ┌─────────────┐
       └─────────<│  Collection  │   │   Category   │
                  │  - title     │   │  - name      │
                  │  - handle    │   │  - parent    │
                  └──────────────┘   └─────────────┘

┌─────────────┐   ┌──────────────┐   ┌─────────────┐
│   Customer   │──<│    Order     │──<│  Line Item   │
│  - email     │   │  - status    │   │  - quantity  │
│  - name      │   │  - total     │   │  - unit_price│
│  - addresses │   │  - region    │   │  - variant   │
└─────────────┘   └──────────────┘   └─────────────┘

┌─────────────┐   ┌──────────────┐
│    Cart      │──<│  Cart Item   │
│  - region    │   │  - quantity  │
│  - customer  │   │  - variant   │
│  - discounts │   │  - metadata  │
└─────────────┘   └──────────────┘
```

### 3.2 PostgreSQL Performance Indexes

After Medusa runs its migrations, add these custom indexes for storefront performance:

```sql
-- Product listing performance
CREATE INDEX idx_product_status_created ON product (status, created_at DESC)
  WHERE status = 'published';
CREATE INDEX idx_product_handle ON product (handle);

-- Variant lookups
CREATE INDEX idx_variant_sku ON product_variant (sku);
CREATE INDEX idx_variant_product ON product_variant (product_id);

-- Order queries
CREATE INDEX idx_order_customer ON "order" (customer_id, created_at DESC);
CREATE INDEX idx_order_status ON "order" (status, created_at DESC);

-- Full-text search fallback (if Meilisearch is down)
CREATE INDEX idx_product_search ON product
  USING GIN (to_tsvector('english', title || ' ' || COALESCE(description, '')));
```

### 3.3 Redis Configuration

Redis serves three purposes in this stack:

| Purpose | Key Pattern | TTL |
|---------|-------------|-----|
| **Session store** | `sess:{sessionId}` | 7 days |
| **API response cache** | `cache:products:{hash}` | 5 minutes |
| **Rate limiting** | `rl:{ip}:{endpoint}` | Sliding window |
| **Cart state** | `cart:{cartId}` | 30 days |

Medusa handles session and cart caching internally. You'll configure rate limiting in section 12.

### 3.4 Local Development Docker Compose

Create this at the project root for local development:

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: medusa
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  meilisearch:
    image: getmeili/meilisearch:v1.7
    environment:
      MEILI_MASTER_KEY: "local-dev-master-key"
      MEILI_ENV: development
      MEILI_NO_ANALYTICS: true
    ports:
      - "7700:7700"
    volumes:
      - meili_data:/meili_data

volumes:
  postgres_data:
  redis_data:
  meili_data:
```

```bash
# Start all local services
docker compose up -d

# Verify everything is running
docker compose ps
docker compose logs -f  # watch logs
```

---

## 4. Medusa.js v2 Backend

### 4.1 Create Medusa Project

```bash
cd apps/

# Create Medusa backend
npx create-medusa-app@latest backend --skip-db

cd backend

# Install dependencies
pnpm install

# Install additional plugins we'll need
pnpm add medusa-plugin-meilisearch
pnpm add medusa-payment-stripe
pnpm add @medusajs/medusa-plugin-resend  # or use the notification API
```

### 4.2 Configure Medusa

Edit `medusa-config.ts`:

```typescript
// apps/backend/medusa-config.ts
import { defineConfig, loadEnv } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

export default defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || 'supersecret-change-in-prod',
      cookieSecret: process.env.COOKIE_SECRET || 'supersecret-change-in-prod',
    },
  },
  modules: [
    // Payment — Stripe
    {
      resolve: '@medusajs/medusa/payment',
      options: {
        providers: [
          {
            resolve: '@medusajs/medusa/payment-stripe',
            id: 'stripe',
            options: {
              apiKey: process.env.STRIPE_API_KEY,
              webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
            },
          },
        ],
      },
    },
    // Search — Meilisearch
    {
      resolve: 'medusa-plugin-meilisearch',
      options: {
        config: {
          host: process.env.MEILISEARCH_HOST,
          apiKey: process.env.MEILISEARCH_API_KEY,
        },
        settings: {
          products: {
            indexSettings: {
              searchableAttributes: [
                'title',
                'description',
                'variant_sku',
                'collection_title',
                'categories',
              ],
              filterableAttributes: [
                'collection_id',
                'category_id',
                'type',
                'tags',
                'status',
              ],
              sortableAttributes: [
                'created_at',
                'updated_at',
                'title',
              ],
              displayedAttributes: [
                'id',
                'title',
                'description',
                'handle',
                'thumbnail',
                'variants',
                'collection_title',
                'categories',
              ],
            },
            primaryKey: 'id',
          },
        },
      },
    },
  ],
})
```

### 4.3 Create Environment File

```bash
# apps/backend/.env
cp ../../.env.example .env
# Edit .env with your actual values

# Generate secure secrets
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))" >> .env
node -e "console.log('COOKIE_SECRET=' + require('crypto').randomBytes(32).toString('hex'))" >> .env
```

### 4.4 Run Migrations & Seed Data

```bash
cd apps/backend

# Run database migrations
pnpm medusa migrations run

# Seed with sample data (optional but recommended for development)
pnpm medusa seed --seed-file=./src/scripts/seed.ts

# Start the backend
pnpm dev
```

Medusa admin dashboard is now available at `http://localhost:9000/app`.

### 4.5 Create Custom API Routes (Examples)

#### Product Reviews Module

```typescript
// apps/backend/src/api/store/reviews/route.ts
import type { MedusaRequest, MedusaResponse } from '@medusajs/medusa'

// GET /store/reviews?product_id=prod_xxx
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { product_id } = req.query
  // Query your custom reviews table
  // Return reviews with ratings, text, customer name
}

// POST /store/reviews
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  // Validate authenticated customer
  // Validate they purchased this product
  // Create review
}
```

#### Wishlist Module

```typescript
// apps/backend/src/api/store/wishlist/route.ts
import type { MedusaRequest, MedusaResponse } from '@medusajs/medusa'

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  // Return customer's wishlist items
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  // Add variant to wishlist
}
```

### 4.6 Event Subscribers

```typescript
// apps/backend/src/subscribers/order-placed.ts
import type { SubscriberArgs, SubscriberConfig } from '@medusajs/medusa'

export default async function orderPlacedHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const orderId = event.data.id
  // Send confirmation email via Resend
  // Update inventory
  // Sync to analytics
  // Trigger Meilisearch reindex if needed
  console.log(`Order placed: ${orderId}`)
}

export const config: SubscriberConfig = {
  event: 'order.placed',
}
```

---

## 5. Search Engine

### 5.1 Meilisearch Configuration

Meilisearch is configured via the Medusa plugin (section 4.2), which automatically syncs products. For additional fine-tuning:

```bash
# Verify Meilisearch is running
curl http://localhost:7700/health
# Expected: {"status":"available"}

# Check indexed documents
curl http://localhost:7700/indexes/products/stats \
  -H "Authorization: Bearer local-dev-master-key"
```

### 5.2 Search API Keys

Generate a search-only key for the frontend (never expose the master key):

```bash
curl -X POST http://localhost:7700/keys \
  -H "Authorization: Bearer local-dev-master-key" \
  -H "Content-Type: application/json" \
  --data '{
    "description": "Storefront search key",
    "actions": ["search"],
    "indexes": ["products"],
    "expiresAt": null
  }'
```

Save the returned API key — this goes in the storefront's public env vars.

### 5.3 Custom Search Settings (Synonyms, Stop Words, Typos)

```bash
# Add synonyms
curl -X PUT http://localhost:7700/indexes/products/settings/synonyms \
  -H "Authorization: Bearer local-dev-master-key" \
  -H "Content-Type: application/json" \
  --data '{
    "hoodie": ["sweatshirt", "pullover"],
    "tee": ["t-shirt", "tshirt"],
    "pants": ["trousers", "jeans"]
  }'

# Configure typo tolerance
curl -X PATCH http://localhost:7700/indexes/products/settings/typo-tolerance \
  -H "Authorization: Bearer local-dev-master-key" \
  -H "Content-Type: application/json" \
  --data '{
    "enabled": true,
    "minWordSizeForTypos": {
      "oneTypo": 4,
      "twoTypos": 8
    }
  }'
```

---

## 6. SvelteKit Storefront

### 6.1 Create SvelteKit Project

```bash
cd apps/

# Create SvelteKit app
pnpm create svelte@latest storefront
# Choose: Skeleton project
# Choose: TypeScript
# Choose: ESLint + Prettier

cd storefront

# Install core dependencies
pnpm add -D tailwindcss @tailwindcss/vite
pnpm add zod sveltekit-superforms
pnpm add meilisearch
pnpm add @stripe/stripe-js
pnpm add blurhash  # for image placeholders
pnpm add gsap      # for animations
pnpm add motion    # Motion One — lightweight alternative for simpler animations

# Install dev tools
pnpm add -D @sveltejs/adapter-node
```

### 6.2 SvelteKit Configuration

```typescript
// apps/storefront/svelte.config.js
import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      envPrefix: 'PUBLIC_',
    }),
    alias: {
      $components: './src/lib/components',
      $ui: './src/lib/components/ui',
      $server: './src/lib/server',
      $utils: './src/lib/utils',
      $stores: './src/lib/stores',
    },
  },
};

export default config;
```

```typescript
// apps/storefront/vite.config.ts
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
});
```

### 6.3 Tailwind CSS Setup

```css
/* apps/storefront/src/app.css */
@import 'tailwindcss';

/* Custom design tokens */
@theme {
  --color-primary: #1a1a2e;
  --color-accent: #e94560;
  --color-surface: #f8f9fa;
  --color-surface-dark: #16213e;
  --color-text: #0f0f0f;
  --color-text-muted: #6b7280;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;

  --font-sans: 'Inter Variable', system-ui, sans-serif;
  --font-display: 'Plus Jakarta Sans Variable', system-ui, sans-serif;
}
```

### 6.4 Project Layout

```
apps/storefront/src/
├── app.css                    # Tailwind + design tokens
├── app.html                   # HTML shell
├── hooks.server.ts            # Security headers, rate limiting, auth
├── lib/
│   ├── components/
│   │   ├── ui/                # shadcn-svelte components
│   │   │   ├── button/
│   │   │   ├── card/
│   │   │   ├── dialog/
│   │   │   ├── input/
│   │   │   ├── skeleton/
│   │   │   ├── sheet/         # slide-over panels (cart, filters)
│   │   │   ├── toast/
│   │   │   └── ...
│   │   ├── shop/              # ecommerce-specific components
│   │   │   ├── ProductCard.svelte
│   │   │   ├── ProductGrid.svelte
│   │   │   ├── ProductGallery.svelte
│   │   │   ├── CartDrawer.svelte
│   │   │   ├── CartItem.svelte
│   │   │   ├── SearchOverlay.svelte
│   │   │   ├── FilterSidebar.svelte
│   │   │   ├── PriceDisplay.svelte
│   │   │   ├── QuantitySelector.svelte
│   │   │   ├── ReviewStars.svelte
│   │   │   └── CheckoutSteps.svelte
│   │   └── layout/
│   │       ├── Header.svelte
│   │       ├── Footer.svelte
│   │       ├── Navigation.svelte
│   │       ├── MobileMenu.svelte
│   │       ├── AnnouncementBar.svelte
│   │       └── Breadcrumbs.svelte
│   ├── server/
│   │   ├── medusa.ts          # Medusa API client
│   │   ├── auth.ts            # Authentication helpers
│   │   ├── rate-limit.ts      # Rate limiting middleware
│   │   └── cache.ts           # Redis cache helpers
│   ├── stores/
│   │   ├── cart.ts            # Cart state (Svelte store)
│   │   ├── search.ts          # Search state
│   │   └── notifications.ts   # Toast notifications
│   └── utils/
│       ├── format.ts          # Price formatting, date formatting
│       ├── blurhash.ts        # Blurhash decode/encode
│       ├── validation.ts      # Zod schemas (shared with server)
│       └── seo.ts             # Meta tag helpers
├── routes/
│   ├── +layout.svelte         # Root layout (header, footer, cart drawer)
│   ├── +layout.server.ts      # Load cart, customer session
│   ├── +page.svelte           # Homepage
│   ├── +page.server.ts        # Load featured products, collections
│   ├── (shop)/
│   │   ├── products/
│   │   │   ├── +page.svelte           # Product listing / catalog
│   │   │   ├── +page.server.ts        # Load products with pagination
│   │   │   └── [handle]/
│   │   │       ├── +page.svelte       # Product detail page
│   │   │       └── +page.server.ts    # Load single product + related
│   │   ├── collections/
│   │   │   └── [handle]/
│   │   │       ├── +page.svelte       # Collection page
│   │   │       └── +page.server.ts
│   │   ├── search/
│   │   │   ├── +page.svelte           # Search results page
│   │   │   └── +page.server.ts
│   │   └── cart/
│   │       ├── +page.svelte           # Full cart page
│   │       └── +page.server.ts
│   ├── (checkout)/
│   │   └── checkout/
│   │       ├── +layout.svelte         # Minimal checkout layout (no nav)
│   │       ├── +page.svelte           # Multi-step checkout
│   │       ├── +page.server.ts        # Load cart for checkout
│   │       └── complete/
│   │           ├── +page.svelte       # Order confirmation
│   │           └── +page.server.ts    # Verify order, clear cart
│   ├── (account)/
│   │   └── account/
│   │       ├── +layout.svelte         # Account layout with sidebar
│   │       ├── +layout.server.ts      # Auth guard — redirect if not logged in
│   │       ├── +page.svelte           # Account overview / dashboard
│   │       ├── orders/
│   │       │   ├── +page.svelte       # Order history
│   │       │   └── [id]/
│   │       │       └── +page.svelte   # Order detail
│   │       ├── addresses/
│   │       │   └── +page.svelte       # Manage addresses
│   │       └── settings/
│   │           └── +page.svelte       # Profile settings, passkey management
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── +page.svelte           # Login (email + passkey)
│   │   └── register/
│   │       └── +page.svelte           # Registration
│   └── (content)/
│       ├── about/
│       │   └── +page.svelte
│       ├── contact/
│       │   └── +page.svelte
│       └── blog/
│           ├── +page.svelte           # Blog listing
│           └── [slug]/
│               └── +page.svelte       # Blog post (MDsveX)
└── params/
    └── handle.ts                      # URL parameter validation
```

### 6.5 Medusa API Client

```typescript
// apps/storefront/src/lib/server/medusa.ts
import { env } from '$env/dynamic/private';

const MEDUSA_URL = env.MEDUSA_BACKEND_URL || 'http://localhost:9000';

type FetchOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  query?: Record<string, string>;
};

async function medusaRequest<T>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const { method = 'GET', body, headers = {}, query } = options;

  let url = `${MEDUSA_URL}${path}`;
  if (query) {
    const params = new URLSearchParams(query);
    url += `?${params.toString()}`;
  }

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      `Medusa API error: ${response.status} ${JSON.stringify(error)}`
    );
  }

  return response.json();
}

// === Products ===

export async function getProducts(params?: {
  limit?: number;
  offset?: number;
  collection_id?: string[];
  category_id?: string[];
}) {
  const query: Record<string, string> = {};
  if (params?.limit) query.limit = String(params.limit);
  if (params?.offset) query.offset = String(params.offset);
  // Medusa v2 uses array params like collection_id[]=xxx

  return medusaRequest<{ products: any[]; count: number }>(
    '/store/products',
    { query }
  );
}

export async function getProductByHandle(handle: string) {
  const data = await medusaRequest<{ products: any[] }>(
    '/store/products',
    { query: { handle } }
  );
  return data.products[0] || null;
}

// === Collections ===

export async function getCollections() {
  return medusaRequest<{ collections: any[] }>('/store/collections');
}

// === Cart ===

export async function createCart(regionId: string) {
  return medusaRequest<{ cart: any }>('/store/carts', {
    method: 'POST',
    body: { region_id: regionId },
  });
}

export async function getCart(cartId: string) {
  return medusaRequest<{ cart: any }>(`/store/carts/${cartId}`);
}

export async function addToCart(
  cartId: string,
  variantId: string,
  quantity: number
) {
  return medusaRequest<{ cart: any }>(`/store/carts/${cartId}/line-items`, {
    method: 'POST',
    body: { variant_id: variantId, quantity },
  });
}

export async function updateLineItem(
  cartId: string,
  lineItemId: string,
  quantity: number
) {
  return medusaRequest<{ cart: any }>(
    `/store/carts/${cartId}/line-items/${lineItemId}`,
    {
      method: 'POST',
      body: { quantity },
    }
  );
}

export async function removeLineItem(cartId: string, lineItemId: string) {
  return medusaRequest<{ cart: any }>(
    `/store/carts/${cartId}/line-items/${lineItemId}`,
    { method: 'DELETE' }
  );
}

// === Checkout ===

export async function addShippingAddress(cartId: string, address: any) {
  return medusaRequest<{ cart: any }>(`/store/carts/${cartId}`, {
    method: 'POST',
    body: { shipping_address: address },
  });
}

export async function setPaymentSession(
  cartId: string,
  providerId: string
) {
  return medusaRequest<{ cart: any }>(
    `/store/carts/${cartId}/payment-sessions`,
    {
      method: 'POST',
      body: { provider_id: providerId },
    }
  );
}

export async function completeCart(cartId: string) {
  return medusaRequest<{ type: string; data: any }>(
    `/store/carts/${cartId}/complete`,
    { method: 'POST' }
  );
}

// === Customer ===

export async function getCustomer(token: string) {
  return medusaRequest<{ customer: any }>('/store/customers/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
}
```

### 6.6 Root Layout

```svelte
<!-- apps/storefront/src/routes/+layout.svelte -->
<script lang="ts">
  import '../app.css';
  import Header from '$components/layout/Header.svelte';
  import Footer from '$components/layout/Footer.svelte';
  import CartDrawer from '$components/shop/CartDrawer.svelte';
  import SearchOverlay from '$components/shop/SearchOverlay.svelte';
  import { Toaster } from '$ui/toast';

  let { children, data } = $props();

  let cartOpen = $state(false);
  let searchOpen = $state(false);
</script>

<svelte:head>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</svelte:head>

<div class="flex min-h-screen flex-col">
  <Header
    cart={data.cart}
    onCartClick={() => (cartOpen = true)}
    onSearchClick={() => (searchOpen = true)}
  />

  <main class="flex-1">
    {@render children()}
  </main>

  <Footer />
</div>

<CartDrawer bind:open={cartOpen} cart={data.cart} />
<SearchOverlay bind:open={searchOpen} />
<Toaster />
```

```typescript
// apps/storefront/src/routes/+layout.server.ts
import { getCart } from '$server/medusa';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies }) => {
  const cartId = cookies.get('cart_id');

  let cart = null;
  if (cartId) {
    try {
      const data = await getCart(cartId);
      cart = data.cart;
    } catch {
      // Cart expired or invalid — clear cookie
      cookies.delete('cart_id', { path: '/' });
    }
  }

  return { cart };
};
```

### 6.7 Homepage Example

```svelte
<!-- apps/storefront/src/routes/+page.svelte -->
<script lang="ts">
  import ProductGrid from '$components/shop/ProductGrid.svelte';
  import { onMount } from 'svelte';
  import gsap from 'gsap';

  let { data } = $props();

  let heroRef: HTMLElement;

  onMount(() => {
    // Staggered hero animation
    gsap.from(heroRef.querySelectorAll('[data-animate]'), {
      y: 40,
      opacity: 0,
      duration: 0.8,
      stagger: 0.15,
      ease: 'power3.out',
    });
  });
</script>

<svelte:head>
  <title>My Store — Premium Products</title>
  <meta name="description" content="Discover our curated collection." />
</svelte:head>

<!-- Hero Section -->
<section bind:this={heroRef} class="relative overflow-hidden bg-primary px-6 py-24 text-white">
  <div class="mx-auto max-w-7xl">
    <h1 data-animate class="font-display text-5xl font-bold tracking-tight md:text-7xl">
      Crafted for<br />the everyday.
    </h1>
    <p data-animate class="mt-6 max-w-lg text-lg text-white/70">
      Thoughtfully designed products that blend form and function.
    </p>
    <div data-animate class="mt-8 flex gap-4">
      <a href="/products" class="rounded-full bg-accent px-8 py-3 font-medium transition hover:bg-accent/90">
        Shop All
      </a>
      <a href="/collections" class="rounded-full border border-white/30 px-8 py-3 font-medium transition hover:bg-white/10">
        Collections
      </a>
    </div>
  </div>
</section>

<!-- Featured Products -->
<section class="mx-auto max-w-7xl px-6 py-16">
  <h2 class="font-display text-3xl font-bold">New Arrivals</h2>
  <ProductGrid products={data.featuredProducts} class="mt-8" />
</section>

<!-- Collections Grid -->
<section class="bg-surface px-6 py-16">
  <div class="mx-auto max-w-7xl">
    <h2 class="font-display text-3xl font-bold">Collections</h2>
    <div class="mt-8 grid gap-6 md:grid-cols-3">
      {#each data.collections as collection}
        <a
          href="/collections/{collection.handle}"
          class="group relative aspect-[4/3] overflow-hidden rounded-2xl"
        >
          <img
            src={collection.metadata?.image}
            alt={collection.title}
            class="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <h3 class="absolute bottom-6 left-6 text-2xl font-bold text-white">
            {collection.title}
          </h3>
        </a>
      {/each}
    </div>
  </div>
</section>
```

```typescript
// apps/storefront/src/routes/+page.server.ts
import { getProducts, getCollections } from '$server/medusa';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const [productsData, collectionsData] = await Promise.all([
    getProducts({ limit: 8 }),
    getCollections(),
  ]);

  return {
    featuredProducts: productsData.products,
    collections: collectionsData.collections,
  };
};
```

---

## 7. Design System & UX Layer

### 7.1 Install shadcn-svelte

```bash
cd apps/storefront

# Initialize shadcn-svelte
pnpm dlx shadcn-svelte@latest init
# Choose: Default style
# Choose: Tailwind CSS
# Set components path: src/lib/components/ui

# Add essential components
pnpm dlx shadcn-svelte@latest add button
pnpm dlx shadcn-svelte@latest add card
pnpm dlx shadcn-svelte@latest add dialog
pnpm dlx shadcn-svelte@latest add input
pnpm dlx shadcn-svelte@latest add label
pnpm dlx shadcn-svelte@latest add select
pnpm dlx shadcn-svelte@latest add sheet
pnpm dlx shadcn-svelte@latest add skeleton
pnpm dlx shadcn-svelte@latest add badge
pnpm dlx shadcn-svelte@latest add separator
pnpm dlx shadcn-svelte@latest add tooltip
pnpm dlx shadcn-svelte@latest add dropdown-menu
pnpm dlx shadcn-svelte@latest add tabs
pnpm dlx shadcn-svelte@latest add accordion

# Toast notifications
pnpm add svelte-sonner
```

### 7.2 Self-Hosted Fonts (Fontsource)

```bash
pnpm add @fontsource-variable/inter @fontsource-variable/plus-jakarta-sans
```

```typescript
// apps/storefront/src/routes/+layout.svelte — add at top of <script>
import '@fontsource-variable/inter';
import '@fontsource-variable/plus-jakarta-sans';
```

### 7.3 GSAP Animations Setup

```typescript
// apps/storefront/src/lib/utils/animations.ts
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Only register on client
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// Reusable animation presets
export const fadeInUp = (element: HTMLElement, delay = 0) => {
  gsap.from(element, {
    y: 30,
    opacity: 0,
    duration: 0.6,
    delay,
    ease: 'power2.out',
  });
};

export const staggerChildren = (
  parent: HTMLElement,
  selector: string,
  stagger = 0.1
) => {
  gsap.from(parent.querySelectorAll(selector), {
    y: 20,
    opacity: 0,
    duration: 0.5,
    stagger,
    ease: 'power2.out',
  });
};

// Product image zoom on hover
export const imageHoverZoom = (container: HTMLElement, img: HTMLElement) => {
  const tl = gsap.timeline({ paused: true });
  tl.to(img, { scale: 1.08, duration: 0.4, ease: 'power2.out' });

  container.addEventListener('mouseenter', () => tl.play());
  container.addEventListener('mouseleave', () => tl.reverse());

  return () => {
    container.removeEventListener('mouseenter', () => tl.play());
    container.removeEventListener('mouseleave', () => tl.reverse());
  };
};

// Scroll-triggered product grid reveal
export const scrollRevealGrid = (grid: HTMLElement) => {
  const items = grid.querySelectorAll('[data-product-card]');
  gsap.from(items, {
    scrollTrigger: {
      trigger: grid,
      start: 'top 80%',
    },
    y: 40,
    opacity: 0,
    duration: 0.6,
    stagger: 0.08,
    ease: 'power2.out',
  });
};

// Cart item fly-in animation
export const cartFlyIn = (element: HTMLElement) => {
  gsap.from(element, {
    x: 50,
    opacity: 0,
    duration: 0.3,
    ease: 'power2.out',
  });
};

// Page transition (pair with SvelteKit navigation)
export const pageTransition = {
  in: (node: HTMLElement) => {
    gsap.from(node, {
      opacity: 0,
      y: 10,
      duration: 0.3,
      ease: 'power2.out',
    });
  },
  out: (node: HTMLElement) => {
    return new Promise<void>((resolve) => {
      gsap.to(node, {
        opacity: 0,
        y: -10,
        duration: 0.2,
        ease: 'power2.in',
        onComplete: resolve,
      });
    });
  },
};
```

### 7.4 Blurhash Image Component

```svelte
<!-- apps/storefront/src/lib/components/shop/BlurImage.svelte -->
<script lang="ts">
  import { decode } from 'blurhash';
  import { onMount } from 'svelte';

  interface Props {
    src: string;
    alt: string;
    blurhash?: string;
    width: number;
    height: number;
    class?: string;
    sizes?: string;
  }

  let {
    src,
    alt,
    blurhash,
    width,
    height,
    class: className = '',
    sizes = '100vw',
  }: Props = $props();

  let loaded = $state(false);
  let canvas: HTMLCanvasElement;

  onMount(() => {
    if (blurhash && canvas) {
      const pixels = decode(blurhash, 32, 32);
      const ctx = canvas.getContext('2d')!;
      const imageData = ctx.createImageData(32, 32);
      imageData.data.set(pixels);
      ctx.putImageData(imageData, 0, 0);
    }
  });

  // Generate Cloudinary responsive srcset
  function cloudinarySrcset(url: string) {
    const widths = [320, 640, 960, 1280, 1600];
    return widths
      .map((w) => {
        // Transform Cloudinary URL for each width
        const transformed = url.replace(
          '/upload/',
          `/upload/w_${w},f_auto,q_auto/`
        );
        return `${transformed} ${w}w`;
      })
      .join(', ');
  }
</script>

<div class="relative overflow-hidden {className}" style="aspect-ratio: {width}/{height}">
  <!-- Blurhash placeholder -->
  {#if blurhash}
    <canvas
      bind:this={canvas}
      width={32}
      height={32}
      class="absolute inset-0 h-full w-full scale-110 blur-lg transition-opacity duration-500"
      class:opacity-0={loaded}
    />
  {/if}

  <!-- Actual image -->
  <img
    {src}
    {alt}
    {width}
    {height}
    {sizes}
    srcset={cloudinarySrcset(src)}
    loading="lazy"
    decoding="async"
    onload={() => (loaded = true)}
    class="h-full w-full object-cover transition-opacity duration-500"
    class:opacity-0={!loaded}
  />
</div>
```

### 7.5 Key UX Patterns

**Optimistic Cart Updates:**

```typescript
// apps/storefront/src/lib/stores/cart.ts
import { writable, derived } from 'svelte/store';

interface CartItem {
  id: string;
  variant_id: string;
  title: string;
  quantity: number;
  unit_price: number;
  thumbnail: string;
}

interface Cart {
  id: string;
  items: CartItem[];
  total: number;
}

export const cart = writable<Cart | null>(null);
export const cartCount = derived(cart, ($cart) =>
  $cart ? $cart.items.reduce((sum, item) => sum + item.quantity, 0) : 0
);

// Optimistic update: instantly update UI, then sync with server
export async function addToCart(variantId: string, quantity: number = 1) {
  const currentCart = get(cart);
  if (!currentCart) return;

  // Optimistic: update store immediately
  cart.update((c) => {
    if (!c) return c;
    const existing = c.items.find((i) => i.variant_id === variantId);
    if (existing) {
      existing.quantity += quantity;
    }
    return { ...c };
  });

  try {
    // Server sync
    const response = await fetch('/api/cart/add', {
      method: 'POST',
      body: JSON.stringify({ variant_id: variantId, quantity }),
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await response.json();
    cart.set(data.cart); // Replace with server truth
  } catch {
    // Rollback on failure
    cart.set(currentCart);
  }
}

function get<T>(store: { subscribe: (fn: (value: T) => void) => void }): T {
  let value: T;
  store.subscribe((v) => (value = v))();
  return value!;
}
```

**View Transitions:**

```svelte
<!-- Add to app.html -->
<head>
  <style>
    @view-transition {
      navigation: auto;
    }
    ::view-transition-old(root) {
      animation: fade-out 0.15s ease;
    }
    ::view-transition-new(root) {
      animation: fade-in 0.15s ease;
    }
    @keyframes fade-out {
      to { opacity: 0; }
    }
    @keyframes fade-in {
      from { opacity: 0; }
    }
  </style>
</head>
```

---

## 8. Authentication & Passwordless

### 8.1 Lucia Auth Setup

```bash
cd apps/storefront
pnpm add lucia @lucia-auth/adapter-postgresql
pnpm add @simplewebauthn/server @simplewebauthn/browser
pnpm add oslo  # utility lib for auth (hashing, tokens, etc.)
```

```typescript
// apps/storefront/src/lib/server/auth.ts
import { Lucia } from 'lucia';
import { NodePostgresAdapter } from '@lucia-auth/adapter-postgresql';
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new NodePostgresAdapter(pool, {
  user: 'customer',       // your customers table
  session: 'customer_session',
});

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    },
  },
  getUserAttributes: (attributes) => {
    return {
      email: attributes.email,
      name: attributes.name,
    };
  },
});

declare module 'lucia' {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: {
      email: string;
      name: string;
    };
  }
}
```

### 8.2 Passkey Registration & Login

```typescript
// apps/storefront/src/lib/server/webauthn.ts
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';

const RP_NAME = 'My Store';
const RP_ID = process.env.NODE_ENV === 'production' ? 'yourdomain.com' : 'localhost';
const ORIGIN = process.env.NODE_ENV === 'production'
  ? 'https://yourdomain.com'
  : 'http://localhost:5173';

// Generate options for registering a new passkey
export async function getRegistrationOptions(user: {
  id: string;
  email: string;
  existingCredentials: { id: string; transports?: string[] }[];
}) {
  return generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: RP_ID,
    userID: user.id,
    userName: user.email,
    attestationType: 'none',
    excludeCredentials: user.existingCredentials.map((cred) => ({
      id: cred.id,
      type: 'public-key',
      transports: cred.transports as AuthenticatorTransport[],
    })),
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
    },
  });
}

// Verify the registration response from the browser
export async function verifyRegistration(
  response: any,
  expectedChallenge: string
) {
  return verifyRegistrationResponse({
    response,
    expectedChallenge,
    expectedOrigin: ORIGIN,
    expectedRPID: RP_ID,
  });
}

// Generate options for logging in with a passkey
export async function getAuthenticationOptions(
  allowCredentials?: { id: string; transports?: string[] }[]
) {
  return generateAuthenticationOptions({
    rpID: RP_ID,
    allowCredentials: allowCredentials?.map((cred) => ({
      id: cred.id,
      type: 'public-key',
      transports: cred.transports as AuthenticatorTransport[],
    })),
    userVerification: 'preferred',
  });
}

// Verify the authentication response
export async function verifyAuthentication(
  response: any,
  expectedChallenge: string,
  credential: { publicKey: Uint8Array; counter: number }
) {
  return verifyAuthenticationResponse({
    response,
    expectedChallenge,
    expectedOrigin: ORIGIN,
    expectedRPID: RP_ID,
    authenticator: {
      credentialPublicKey: credential.publicKey,
      counter: credential.counter,
      credentialID: response.id,
    },
  });
}
```

### 8.3 Database Tables for Auth

```sql
-- Run this migration on your PostgreSQL database

-- Customer accounts (extends Medusa's customer)
CREATE TABLE IF NOT EXISTS customer_session (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- WebAuthn credentials (passkeys)
CREATE TABLE IF NOT EXISTS webauthn_credential (
  id TEXT PRIMARY KEY,                        -- credential ID from authenticator
  customer_id TEXT NOT NULL,                  -- FK to customer
  public_key BYTEA NOT NULL,                 -- credential public key
  counter INTEGER NOT NULL DEFAULT 0,        -- sign counter
  transports TEXT[],                          -- e.g. {'usb', 'ble', 'nfc', 'internal'}
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

CREATE INDEX idx_webauthn_customer ON webauthn_credential (customer_id);
```

---

## 9. Payments (Stripe)

### 9.1 Stripe Configuration

Medusa handles most of the Stripe integration via the payment module configured in section 4.2. Here's what you need on the storefront side:

```typescript
// apps/storefront/src/lib/utils/stripe.ts
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { env } from '$env/dynamic/public';

let stripePromise: Promise<Stripe | null>;

export function getStripe() {
  if (!stripePromise) {
    stripePromise = loadStripe(env.PUBLIC_STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
}
```

### 9.2 Checkout Payment Step

```svelte
<!-- apps/storefront/src/lib/components/shop/PaymentForm.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { getStripe } from '$utils/stripe';

  interface Props {
    clientSecret: string;
    onSuccess: () => void;
    onError: (message: string) => void;
  }

  let { clientSecret, onSuccess, onError }: Props = $props();

  let stripe: any;
  let elements: any;
  let paymentElement: HTMLDivElement;
  let processing = $state(false);

  onMount(async () => {
    stripe = await getStripe();
    if (!stripe) return;

    elements = stripe.elements({
      clientSecret,
      appearance: {
        theme: 'stripe',
        variables: {
          colorPrimary: '#1a1a2e',
          colorBackground: '#ffffff',
          borderRadius: '12px',
          fontFamily: 'Inter Variable, system-ui, sans-serif',
        },
      },
    });

    const payment = elements.create('payment');
    payment.mount(paymentElement);
  });

  async function handleSubmit() {
    if (!stripe || !elements || processing) return;

    processing = true;

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/complete`,
      },
    });

    if (error) {
      onError(error.message || 'Payment failed');
      processing = false;
    } else {
      onSuccess();
    }
  }
</script>

<form onsubmit|preventDefault={handleSubmit}>
  <div bind:this={paymentElement}></div>

  <button
    type="submit"
    disabled={processing}
    class="mt-6 w-full rounded-full bg-primary py-4 font-medium text-white
           transition hover:bg-primary/90 disabled:opacity-50"
  >
    {processing ? 'Processing...' : 'Pay Now'}
  </button>
</form>
```

### 9.3 Stripe Webhooks

```typescript
// apps/backend/src/api/webhooks/stripe/route.ts
// Medusa handles Stripe webhooks automatically through its payment module.
// You just need to configure the webhook endpoint in Stripe Dashboard:
//
// Webhook URL: https://api.yourdomain.com/hooks/payment/stripe
// Events to listen for:
//   - payment_intent.succeeded
//   - payment_intent.payment_failed
//   - charge.refunded
//   - charge.dispute.created

// For local development, use Stripe CLI:
// stripe listen --forward-to localhost:9000/hooks/payment/stripe
```

### 9.4 Stripe Test Cards

| Card Number | Scenario |
|-------------|----------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 3220` | Requires 3D Secure |
| `4000 0000 0000 9995` | Declined (insufficient funds) |
| `4000 0025 0000 3155` | Requires authentication |

Use any future date for expiry, any 3-digit CVC, any postal code.

---

## 10. Image Pipeline

### 10.1 Cloudinary Setup

```typescript
// apps/storefront/src/lib/utils/cloudinary.ts
import { env } from '$env/dynamic/public';

const CLOUD_NAME = env.PUBLIC_CLOUDINARY_CLOUD_NAME;

interface TransformOptions {
  width?: number;
  height?: number;
  quality?: 'auto' | number;
  format?: 'auto' | 'webp' | 'avif';
  crop?: 'fill' | 'fit' | 'scale' | 'thumb';
  gravity?: 'auto' | 'face' | 'center';
}

export function cloudinaryUrl(
  publicId: string,
  options: TransformOptions = {}
): string {
  const {
    width,
    height,
    quality = 'auto',
    format = 'auto',
    crop = 'fill',
    gravity = 'auto',
  } = options;

  const transforms: string[] = [`f_${format}`, `q_${quality}`];

  if (width) transforms.push(`w_${width}`);
  if (height) transforms.push(`h_${height}`);
  if (width || height) {
    transforms.push(`c_${crop}`, `g_${gravity}`);
  }

  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transforms.join(',')}/${publicId}`;
}

// Generate srcset for responsive images
export function cloudinarySrcset(
  publicId: string,
  widths = [320, 640, 960, 1280, 1600]
): string {
  return widths
    .map(
      (w) =>
        `${cloudinaryUrl(publicId, { width: w })} ${w}w`
    )
    .join(', ');
}
```

### 10.2 Blurhash Generation

Generate blurhashes for product images on upload (backend side):

```typescript
// apps/backend/src/utils/blurhash.ts
import sharp from 'sharp';
import { encode } from 'blurhash';

export async function generateBlurhash(
  imagePath: string
): Promise<string> {
  const { data, info } = await sharp(imagePath)
    .raw()
    .ensureAlpha()
    .resize(32, 32, { fit: 'inside' })
    .toBuffer({ resolveWithObject: true });

  return encode(
    new Uint8ClampedArray(data),
    info.width,
    info.height,
    4,  // x components
    3   // y components
  );
}

// Store the blurhash in product metadata:
// product.metadata.blurhash = await generateBlurhash(imagePath);
```

---

## 11. Email System

### 11.1 Resend Setup

```typescript
// apps/backend/src/services/email.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail({
  to,
  subject,
  html,
  from = 'My Store <noreply@yourdomain.com>',
}: SendEmailOptions) {
  try {
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
    });

    if (error) {
      console.error('Email send error:', error);
      throw error;
    }

    return data;
  } catch (err) {
    console.error('Email service error:', err);
    throw err;
  }
}
```

### 11.2 Email Templates

```typescript
// apps/backend/src/templates/order-confirmation.ts
export function orderConfirmationEmail(order: {
  display_id: string;
  email: string;
  items: { title: string; quantity: number; unit_price: number }[];
  total: number;
  shipping_address: { first_name: string };
  currency_code: string;
}) {
  const itemRows = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #eee;">
          ${item.title}
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: center;">
          ${item.quantity}
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: right;">
          ${formatPrice(item.unit_price * item.quantity, order.currency_code)}
        </td>
      </tr>`
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0; padding:0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8f9fa;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
          <h1 style="margin: 0 0 8px; font-size: 24px; color: #1a1a2e;">
            Order Confirmed ✓
          </h1>
          <p style="color: #6b7280; margin: 0 0 32px;">
            Hi ${order.shipping_address.first_name}, thanks for your order #${order.display_id}!
          </p>

          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr>
                <th style="text-align: left; padding: 8px 0; border-bottom: 2px solid #1a1a2e; font-size: 14px;">Item</th>
                <th style="text-align: center; padding: 8px 0; border-bottom: 2px solid #1a1a2e; font-size: 14px;">Qty</th>
                <th style="text-align: right; padding: 8px 0; border-bottom: 2px solid #1a1a2e; font-size: 14px;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemRows}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2" style="padding: 16px 0; text-align: right; font-weight: bold;">Total</td>
                <td style="padding: 16px 0; text-align: right; font-weight: bold; font-size: 18px;">
                  ${formatPrice(order.total, order.currency_code)}
                </td>
              </tr>
            </tfoot>
          </table>

          <a href="https://yourdomain.com/account/orders/${order.display_id}"
             style="display: block; text-align: center; background: #1a1a2e; color: white; padding: 14px; border-radius: 50px; text-decoration: none; margin-top: 32px; font-weight: 500;">
            View Order
          </a>
        </div>
      </div>
    </body>
    </html>
  `;
}

function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}
```

### 11.3 Wire Up Event Subscribers

```typescript
// apps/backend/src/subscribers/order-placed.ts
import type { SubscriberArgs, SubscriberConfig } from '@medusajs/medusa';
import { sendEmail } from '../services/email';
import { orderConfirmationEmail } from '../templates/order-confirmation';

export default async function orderPlacedHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const orderService = container.resolve('orderService');
  const order = await orderService.retrieve(event.data.id, {
    relations: ['items', 'shipping_address', 'customer'],
  });

  await sendEmail({
    to: order.email,
    subject: `Order #${order.display_id} confirmed`,
    html: orderConfirmationEmail(order),
  });
}

export const config: SubscriberConfig = {
  event: 'order.placed',
};
```

---

## 12. Security Hardening

### 12.1 SvelteKit Security Headers

```typescript
// apps/storefront/src/hooks.server.ts
import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { lucia } from '$server/auth';

// Security Headers
const securityHeaders: Handle = async ({ event, resolve }) => {
  const response = await resolve(event);

  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://js.stripe.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://res.cloudinary.com https://*.stripe.com",
      "font-src 'self'",
      "connect-src 'self' https://api.stripe.com https://*.meilisearch.com wss:",
      "frame-src https://js.stripe.com https://hooks.stripe.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join('; ')
  );

  // Other security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '0'); // Disabled — CSP is better
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );

  return response;
};

// Rate Limiting
import { RateLimiterRedis } from 'rate-limiter-flexible';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const rateLimiters = {
  // General API: 100 requests per minute
  general: new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: 'rl_general',
    points: 100,
    duration: 60,
  }),
  // Auth endpoints: 5 attempts per 15 minutes
  auth: new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: 'rl_auth',
    points: 5,
    duration: 900,
  }),
  // Checkout: 10 attempts per minute
  checkout: new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: 'rl_checkout',
    points: 10,
    duration: 60,
  }),
};

const rateLimit: Handle = async ({ event, resolve }) => {
  const ip =
    event.request.headers.get('cf-connecting-ip') ||
    event.request.headers.get('x-forwarded-for')?.split(',')[0] ||
    event.getClientAddress();

  const path = event.url.pathname;

  try {
    if (path.startsWith('/login') || path.startsWith('/register')) {
      await rateLimiters.auth.consume(ip);
    } else if (path.startsWith('/checkout')) {
      await rateLimiters.checkout.consume(ip);
    } else {
      await rateLimiters.general.consume(ip);
    }
  } catch {
    return new Response('Too Many Requests', {
      status: 429,
      headers: {
        'Retry-After': '60',
      },
    });
  }

  return resolve(event);
};

// Auth session handling
const authHandler: Handle = async ({ event, resolve }) => {
  const sessionId = event.cookies.get(lucia.sessionCookieName);

  if (!sessionId) {
    event.locals.user = null;
    event.locals.session = null;
    return resolve(event);
  }

  const { session, user } = await lucia.validateSession(sessionId);
  if (session?.fresh) {
    const sessionCookie = lucia.createSessionCookie(session.id);
    event.cookies.set(sessionCookie.name, sessionCookie.value, {
      path: '.',
      ...sessionCookie.attributes,
    });
  }
  if (!session) {
    const blankCookie = lucia.createBlankSessionCookie();
    event.cookies.set(blankCookie.name, blankCookie.value, {
      path: '.',
      ...blankCookie.attributes,
    });
  }

  event.locals.user = user;
  event.locals.session = session;

  return resolve(event);
};

export const handle = sequence(securityHeaders, rateLimit, authHandler);
```

### 12.2 Input Validation Schemas (Shared)

```typescript
// apps/storefront/src/lib/utils/validation.ts
import { z } from 'zod';

export const emailSchema = z
  .string()
  .email('Please enter a valid email address')
  .max(255);

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128)
  .regex(/[a-z]/, 'Must contain a lowercase letter')
  .regex(/[A-Z]/, 'Must contain an uppercase letter')
  .regex(/[0-9]/, 'Must contain a number');

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().min(1, 'Last name is required').max(100),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const addressSchema = z.object({
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  address_1: z.string().min(1).max(255),
  address_2: z.string().max(255).optional(),
  city: z.string().min(1).max(100),
  province: z.string().max(100).optional(),
  postal_code: z.string().min(1).max(20),
  country_code: z.string().length(2),
  phone: z
    .string()
    .regex(/^\+?[\d\s-()]{7,20}$/, 'Invalid phone number')
    .optional(),
});

export const addToCartSchema = z.object({
  variant_id: z.string().min(1),
  quantity: z.number().int().min(1).max(99),
});

export const reviewSchema = z.object({
  product_id: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  title: z.string().min(1).max(200),
  content: z.string().min(10).max(2000),
});
```

### 12.3 CrowdSec Installation (VPS)

```bash
# SSH into your VPS as deploy user

# Install CrowdSec
curl -s https://packagecloud.io/install/repositories/crowdsec/crowdsec/script.deb.sh | sudo bash
sudo apt install -y crowdsec crowdsec-firewall-bouncer-iptables

# CrowdSec automatically detects and protects:
# - SSH brute force
# - HTTP scanning/probing
# - Known bad IPs (community blocklists)

# Enroll in CrowdSec console (free) for dashboard
sudo cscli console enroll YOUR_ENROLLMENT_KEY

# Check status
sudo cscli metrics
sudo cscli alerts list
sudo cscli decisions list

# Add Nginx/Caddy parser if Coolify uses either
sudo cscli parsers install crowdsecurity/nginx-logs
sudo systemctl restart crowdsec
```

### 12.4 Dependency Scanning (Socket.dev)

```yaml
# .github/workflows/security.yml
name: Security Scan

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  socket-security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: SocketDev/socket-security-action@v1
        with:
          socket_api_key: ${{ secrets.SOCKET_API_KEY }}

  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: pnpm audit --audit-level=high
```

---

## 13. Performance Optimization

### 13.1 SvelteKit Streaming SSR

```typescript
// apps/storefront/src/routes/products/[handle]/+page.server.ts
import type { PageServerLoad } from './$types';
import { getProductByHandle, getProducts } from '$server/medusa';

export const load: PageServerLoad = async ({ params }) => {
  // Load critical data immediately
  const product = await getProductByHandle(params.handle);

  if (!product) {
    throw error(404, 'Product not found');
  }

  // Stream non-critical data (loads in background)
  return {
    product,
    // These resolve after the page starts rendering
    relatedProducts: getProducts({
      collection_id: product.collection_id ? [product.collection_id] : undefined,
      limit: 4,
    }).then((d) => d.products.filter((p) => p.id !== product.id)),
    reviews: fetchReviews(product.id), // your custom endpoint
  };
};
```

```svelte
<!-- Product page using streamed data -->
<script lang="ts">
  let { data } = $props();
</script>

<!-- This renders immediately -->
<ProductDetail product={data.product} />

<!-- This renders when the promise resolves, showing skeleton meanwhile -->
{#await data.relatedProducts}
  <ProductGridSkeleton count={4} />
{:then products}
  <ProductGrid {products} title="You might also like" />
{/await}
```

### 13.2 Caching Strategy

```typescript
// apps/storefront/src/lib/server/cache.ts
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

interface CacheOptions {
  ttl?: number; // seconds
  staleWhileRevalidate?: number; // seconds
}

export async function cached<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const { ttl = 300, staleWhileRevalidate = 60 } = options;

  const cached = await redis.get(`cache:${key}`);

  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    const age = (Date.now() - timestamp) / 1000;

    // Fresh: return immediately
    if (age < ttl) return data;

    // Stale but within SWR window: return stale, refresh in background
    if (age < ttl + staleWhileRevalidate) {
      // Fire and forget — don't await
      refreshCache(key, fetcher, ttl);
      return data;
    }
  }

  // Miss or expired: fetch fresh
  return refreshCache(key, fetcher, ttl);
}

async function refreshCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number
): Promise<T> {
  const data = await fetcher();
  await redis.set(
    `cache:${key}`,
    JSON.stringify({ data, timestamp: Date.now() }),
    'EX',
    ttl + 120 // Keep slightly longer than TTL for SWR
  );
  return data;
}

export async function invalidateCache(pattern: string) {
  const keys = await redis.keys(`cache:${pattern}`);
  if (keys.length) await redis.del(...keys);
}
```

### 13.3 SvelteKit Preloading

```svelte
<!-- Preload on hover (already built into SvelteKit) -->
<a href="/products/{product.handle}" data-sveltekit-preload-data="hover">
  <ProductCard {product} />
</a>

<!-- Preload on viewport enter for important links -->
<a href="/collections/new-arrivals" data-sveltekit-preload-data="tap">
  New Arrivals
</a>
```

### 13.4 Core Web Vitals Monitoring

```typescript
// apps/storefront/src/lib/utils/web-vitals.ts
import { onCLS, onINP, onLCP, onFCP, onTTFB } from 'web-vitals';

export function reportWebVitals() {
  // Send to Umami as custom events
  const report = (metric: { name: string; value: number; rating: string }) => {
    // Umami custom event
    if (typeof window !== 'undefined' && (window as any).umami) {
      (window as any).umami.track(metric.name, {
        value: Math.round(metric.value),
        rating: metric.rating,
      });
    }
  };

  onCLS(report);
  onINP(report);
  onLCP(report);
  onFCP(report);
  onTTFB(report);
}
```

---

## 14. Analytics & Monitoring

### 14.1 Umami Self-Hosted Setup

In Coolify, create a new service:

```yaml
# Umami Docker Compose for Coolify
version: '3.8'
services:
  umami:
    image: ghcr.io/umami-software/umami:postgresql-latest
    environment:
      DATABASE_URL: postgresql://umami:${SERVICE_PASSWORD_UMAMI}@umami-db:5432/umami
      APP_SECRET: ${SERVICE_PASSWORD_SECRET}
    depends_on:
      - umami-db
    ports:
      - "3000:3000"

  umami-db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: umami
      POSTGRES_USER: umami
      POSTGRES_PASSWORD: ${SERVICE_PASSWORD_UMAMI}
    volumes:
      - umami_data:/var/lib/postgresql/data

volumes:
  umami_data:
```

After deploying:
1. Set domain: `analytics.yourdomain.com`
2. Log in (default: admin/umami)
3. Change password immediately
4. Add your website
5. Copy the tracking script

Add to your storefront:

```html
<!-- apps/storefront/src/app.html -->
<script
  async
  defer
  src="https://analytics.yourdomain.com/script.js"
  data-website-id="YOUR-WEBSITE-ID"
></script>
```

### 14.2 Sentry Error Tracking

```bash
cd apps/storefront
pnpm add @sentry/sveltekit
```

```typescript
// apps/storefront/src/hooks.client.ts
import * as Sentry from '@sentry/sveltekit';

Sentry.init({
  dsn: import.meta.env.PUBLIC_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.1, // 10% of transactions
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0.5, // Record 50% of error sessions
});

export const handleError = Sentry.handleErrorWithSentry();
```

```typescript
// apps/storefront/src/hooks.server.ts — add to existing
import * as Sentry from '@sentry/sveltekit';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});

// Add to the sequence() call:
export const handleError = Sentry.handleErrorWithSentry();
```

### 14.3 Uptime Kuma

Deploy via Coolify as a Docker service:

```yaml
version: '3.8'
services:
  uptime-kuma:
    image: louislam/uptime-kuma:1
    volumes:
      - kuma_data:/app/data
    ports:
      - "3001:3001"
volumes:
  kuma_data:
```

Domain: `status.yourdomain.com`

Configure monitors for:
- `https://yourdomain.com` — Storefront (check every 60s)
- `https://api.yourdomain.com/health` — Medusa backend
- `https://search.yourdomain.com/health` — Meilisearch
- PostgreSQL TCP check on internal port
- Redis TCP check on internal port

---

## 15. CI/CD Pipeline

### 15.1 GitHub Actions — Main Pipeline

```yaml
# .github/workflows/ci.yml
name: CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: 20

jobs:
  lint-and-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: pnpm

      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm --filter storefront check  # svelte-check

  build:
    runs-on: ubuntu-latest
    needs: lint-and-check
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: pnpm

      - run: pnpm install --frozen-lockfile
      - run: pnpm build

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: pnpm

      - run: pnpm install --frozen-lockfile
      - run: pnpm audit --audit-level=high

  deploy:
    runs-on: ubuntu-latest
    needs: [build, security]
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Trigger Coolify Deploy
        run: |
          curl -X POST "${{ secrets.COOLIFY_WEBHOOK_URL }}" \
            -H "Authorization: Bearer ${{ secrets.COOLIFY_API_TOKEN }}"
```

### 15.2 Coolify Deployment Configuration

In Coolify, set up two applications:

**Medusa Backend:**
- Source: GitHub repo → `apps/backend`
- Build command: `pnpm build`
- Start command: `pnpm start`
- Domain: `api.yourdomain.com`
- Environment variables: All from `.env`

**SvelteKit Storefront:**
- Source: GitHub repo → `apps/storefront`
- Build command: `pnpm build`
- Start command: `node build/index.js`
- Domain: `yourdomain.com`
- Environment variables: Public + private env vars

---

## 16. Domain & DNS (Cloudflare)

### 16.1 Initial DNS Setup

1. Register domain or transfer DNS to Cloudflare (free plan)
2. In Cloudflare Dashboard → DNS, add these records:

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| A | `@` | `YOUR_VPS_IP` | ✅ Proxied |
| A | `api` | `YOUR_VPS_IP` | ✅ Proxied |
| A | `search` | `YOUR_VPS_IP` | ✅ Proxied |
| A | `analytics` | `YOUR_VPS_IP` | ✅ Proxied |
| A | `status` | `YOUR_VPS_IP` | ✅ Proxied |
| A | `coolify` | `YOUR_VPS_IP` | ❌ DNS only |

### 16.2 Cloudflare Security Settings

**SSL/TLS:**
- Encryption mode: **Full (Strict)**
- Always Use HTTPS: **On**
- Minimum TLS Version: **1.2**
- Automatic HTTPS Rewrites: **On**

**Security:**
- Security Level: **Medium**
- Challenge Passage: **30 minutes**
- Browser Integrity Check: **On**

**Caching:**
- Caching Level: **Standard**
- Browser Cache TTL: **4 hours**
- Always Online: **On**

### 16.3 Cloudflare Page Rules (Free Plan — 3 Rules)

```
Rule 1: API — No cache
  URL: api.yourdomain.com/*
  Cache Level: Bypass

Rule 2: Static assets — Aggressive cache
  URL: yourdomain.com/_app/*
  Cache Level: Cache Everything
  Edge Cache TTL: 1 month
  Browser Cache TTL: 1 year

Rule 3: Product images — Cache
  URL: yourdomain.com/images/*
  Cache Level: Cache Everything
  Edge Cache TTL: 1 week
```

### 16.4 Cloudflare WAF Rules (Free Tier)

Go to **Security → WAF → Custom rules**. Free plan gets 5 rules:

```
Rule 1: Block known bad bots
  Expression: (cf.client.bot) and not (cf.bot_management.verified_bot)
  Action: Block

Rule 2: Rate limit login
  Expression: (http.request.uri.path contains "/login") and (http.request.method eq "POST")
  Action: Rate limit (10 requests per minute per IP)

Rule 3: Block suspicious user agents
  Expression: (http.user_agent contains "sqlmap") or
              (http.user_agent contains "nikto") or
              (http.user_agent contains "nmap")
  Action: Block

Rule 4: Challenge non-browser checkout requests
  Expression: (http.request.uri.path contains "/checkout") and
              (not cf.client.bot) and
              (cf.threat_score gt 30)
  Action: Managed Challenge

Rule 5: Block empty user agents on API
  Expression: (http.host eq "api.yourdomain.com") and
              (http.user_agent eq "")
  Action: Block
```

---

## 17. Go-Live Checklist

### Pre-Launch

```
[ ] VPS provisioned and hardened (UFW, fail2ban, unattended-upgrades)
[ ] Coolify installed and accessible
[ ] PostgreSQL running with strong password
[ ] Redis running
[ ] Meilisearch running with master key set

[ ] Medusa backend deployed and healthy
[ ] Medusa admin accessible, seed data cleaned
[ ] Products, collections, categories created
[ ] Regions and shipping options configured
[ ] Tax settings configured
[ ] Stripe connected in production mode
[ ] Stripe webhook endpoint verified
[ ] Stripe webhook signing secret in production env

[ ] SvelteKit storefront deployed
[ ] All pages rendering correctly
[ ] Cart add/update/remove working
[ ] Checkout flow complete end-to-end
[ ] Email notifications sending (order confirm, shipping, etc.)
[ ] Customer registration and login working
[ ] Passkey registration working
[ ] Search returning correct results

[ ] Cloudflare DNS configured, SSL working
[ ] Security headers verified (securityheaders.com — A+ rating)
[ ] CSP not blocking anything legitimate
[ ] Rate limiting active on auth and checkout endpoints
[ ] CrowdSec running and enrolled

[ ] Sentry tracking errors in production
[ ] Umami tracking page views
[ ] Uptime Kuma monitoring all services
[ ] Web Vitals reporting — LCP < 2.5s, CLS < 0.1, INP < 200ms

[ ] Database backups scheduled (see section 18)
[ ] Socket.dev / dependency scanning active in CI
[ ] All secrets in Coolify, not in code
[ ] .env.example updated, .env in .gitignore
[ ] GSAP license check (free for non-commercial, paid for commercial)
```

### Post-Launch (First Week)

```
[ ] Monitor Sentry for new errors daily
[ ] Check Umami analytics for traffic patterns
[ ] Verify Stripe test transactions appear in dashboard
[ ] Run Lighthouse audit — target 95+ on all metrics
[ ] Run OWASP ZAP scan and fix findings
[ ] Test mobile experience on real devices
[ ] Check search results quality and add synonyms
[ ] Monitor VPS resource usage (CPU, RAM, disk)
[ ] Review CrowdSec alerts
[ ] Test order lifecycle: place → fulfill → ship → deliver
```

---

## 18. Maintenance & Operations

### 18.1 Database Backups

```bash
# infrastructure/backups/backup-db.sh
#!/bin/bash
set -euo pipefail

BACKUP_DIR="/home/deploy/backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

mkdir -p "$BACKUP_DIR"

# Dump database
docker exec coolify-postgres pg_dump -U postgres medusa | gzip > "$BACKUP_DIR/medusa_$DATE.sql.gz"

# Delete backups older than retention period
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: medusa_$DATE.sql.gz"
```

```bash
# Add to crontab (daily at 3 AM UTC)
crontab -e
# Add: 0 3 * * * /home/deploy/infrastructure/backups/backup-db.sh >> /var/log/backup.log 2>&1
```

For offsite backups, consider using rclone to sync to a free Backblaze B2 bucket (10GB free).

### 18.2 Update Strategy

**Weekly:**
- Check for Medusa updates: `pnpm outdated` in backend
- Check for SvelteKit updates: `pnpm outdated` in storefront
- Review Sentry errors and fix critical ones
- Review CrowdSec decisions

**Monthly:**
- Update all dependencies: `pnpm update`
- Run `pnpm audit` and address vulnerabilities
- Review Cloudflare analytics for attack patterns
- Check VPS disk space and clean Docker images: `docker system prune -a`
- Review and rotate secrets if needed

**Quarterly:**
- Major dependency updates (Medusa, SvelteKit)
- Run full OWASP ZAP security scan
- Review and update CSP headers
- Performance audit with Lighthouse
- Review backup restoration process (actually test a restore)

### 18.3 Useful Commands Reference

```bash
# === Local Development ===
docker compose up -d                    # Start local services
pnpm dev:backend                        # Start Medusa
pnpm dev:storefront                     # Start SvelteKit
stripe listen --forward-to localhost:9000/hooks/payment/stripe  # Stripe webhooks

# === Medusa Admin ===
pnpm medusa migrations run              # Run pending migrations
pnpm medusa user -e admin@store.com     # Create admin user

# === Production Debugging ===
ssh deploy@YOUR_VPS_IP
sudo docker ps                          # List running containers
sudo docker logs CONTAINER_NAME -f      # Follow logs
sudo docker exec -it CONTAINER_NAME sh  # Shell into container
sudo cscli alerts list                  # CrowdSec alerts
sudo cscli decisions list               # CrowdSec blocks

# === Database ===
docker exec -it coolify-postgres psql -U postgres medusa  # Connect to DB
# Useful queries:
# SELECT count(*) FROM product WHERE status = 'published';
# SELECT * FROM "order" ORDER BY created_at DESC LIMIT 10;

# === Performance ===
# Test from outside: curl -w "@curl-format.txt" -o /dev/null -s https://yourdomain.com
# Lighthouse CLI: npx lighthouse https://yourdomain.com --output=json
```

### 18.4 Architecture Diagram

```
                                   ┌─────────────────────┐
                                   │     Cloudflare       │
                                   │  DNS · CDN · WAF     │
                                   │  SSL · DDoS · Cache  │
                                   └──────────┬──────────┘
                                              │
                              ┌───────────────┴───────────────┐
                              │                               │
                    ┌─────────▼─────────┐          ┌──────────▼──────────┐
                    │   SvelteKit SSR   │          │   Medusa.js v2 API  │
                    │   (storefront)    │────API──▶│   (backend)         │
                    │                   │          │                     │
                    │ · shadcn-svelte   │          │ · Products/Orders   │
                    │ · GSAP animations │          │ · Cart/Checkout     │
                    │ · Lucia Auth      │          │ · Stripe payments   │
                    │ · Superforms/Zod  │          │ · Event subscribers │
                    │ · Blurhash        │          │ · Admin dashboard   │
                    └─────────┬─────────┘          └──────────┬──────────┘
                              │                               │
            ┌─────────────────┼───────────────────────────────┤
            │                 │                               │
   ┌────────▼────────┐ ┌─────▼──────┐              ┌─────────▼─────────┐
   │   Meilisearch   │ │   Redis    │              │   PostgreSQL 16   │
   │   (search)      │ │  (cache)   │              │   (database)      │
   │                 │ │            │              │                   │
   │ · Product index │ │ · Sessions │              │ · Products        │
   │ · Typo-tolerant │ │ · Rate lim │              │ · Orders          │
   │ · Faceted filter│ │ · API cache│              │ · Customers       │
   └─────────────────┘ │ · Queues   │              │ · Auth sessions   │
                       └────────────┘              │ · WebAuthn creds  │
                                                   └───────────────────┘

   ┌──────────────────────────────────────────────────────────────────┐
   │                      External Services                          │
   │                                                                 │
   │  Stripe          Cloudinary       Resend         Sentry         │
   │  (payments)      (images)         (email)        (errors)       │
   │                                                                 │
   │  Socket.dev      Umami            Uptime Kuma    CrowdSec       │
   │  (dep scan)      (analytics)      (monitoring)   (IPS)          │
   └──────────────────────────────────────────────────────────────────┘

   ┌──────────────────────────────────────────────────────────────────┐
   │                     VPS (Hetzner CX22)                          │
   │  Managed by Coolify · Ubuntu 24.04                              │
   │  UFW · fail2ban · unattended-upgrades · CrowdSec                │
   └──────────────────────────────────────────────────────────────────┘
```

---

## Implementation Order

Follow this sequence to build the platform step by step:

| Phase | Duration | What to Build |
|-------|----------|---------------|
| **Phase 1: Foundation** | 2–3 days | VPS setup, Coolify, Docker Compose, PostgreSQL, Redis |
| **Phase 2: Commerce Core** | 3–5 days | Medusa backend, products, collections, admin config |
| **Phase 3: Storefront Shell** | 3–4 days | SvelteKit project, routing, layout, Medusa API client |
| **Phase 4: Design System** | 2–3 days | shadcn-svelte, fonts, Tailwind tokens, base components |
| **Phase 5: Product Pages** | 3–4 days | Product grid, detail page, image gallery, BlurImage |
| **Phase 6: Cart & Checkout** | 4–5 days | Cart store, drawer, checkout flow, address forms |
| **Phase 7: Payments** | 2–3 days | Stripe integration, webhooks, order confirmation |
| **Phase 8: Search** | 2–3 days | Meilisearch setup, search overlay, faceted filters |
| **Phase 9: Auth** | 3–4 days | Lucia setup, login/register, passkeys, account pages |
| **Phase 10: Email** | 1–2 days | Resend setup, order confirmation template, subscribers |
| **Phase 11: Polish** | 3–4 days | GSAP animations, view transitions, loading states |
| **Phase 12: Security** | 2–3 days | Headers, rate limiting, CrowdSec, WAF rules, scanning |
| **Phase 13: Ops** | 2–3 days | CI/CD, Cloudflare DNS, Sentry, Umami, Uptime Kuma |
| **Phase 14: Launch** | 1–2 days | Go-live checklist, final testing, backup verification |
| **Total** | **~35–50 days** | Working ecommerce platform |

---

*Blueprint Version 1.0 — February 2026*
*Stack: Medusa.js v2 · SvelteKit · PostgreSQL · Redis · Meilisearch · Stripe · Cloudflare · Coolify*
