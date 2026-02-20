# EC1 — MedusaJS + SvelteKit Ecommerce

A full-stack ecommerce platform built with [MedusaJS v2](https://medusajs.com/) (backend) and [SvelteKit](https://kit.svelte.dev/) (storefront).

## Prerequisites

- **Node.js** 20+
- **pnpm** 10+
- **Docker** & Docker Compose (for Postgres, Redis, MeiliSearch)

## Quick Start

```bash
# 1. Start infrastructure services
docker compose up -d

# 2. Install dependencies
pnpm install

# 3. Configure environment
cp apps/backend/.env.template apps/backend/.env
cp apps/storefront/.env.template apps/storefront/.env
# Edit the .env files with your credentials

# 4. Run database migrations
pnpm --filter backend run build
pnpm --filter backend medusa db:migrate

# 5. Seed the database (optional)
pnpm --filter backend run seed

# 6. Start development servers
pnpm dev
```

The backend runs at `http://localhost:9000` and the storefront at `http://localhost:5173`.

## Project Structure

```
├── apps/
│   ├── backend/          # MedusaJS v2 — API, admin, and business logic
│   │   ├── src/
│   │   │   ├── api/      # Custom API routes
│   │   │   ├── jobs/     # Background jobs
│   │   │   ├── lib/      # Shared utilities (logger, etc.)
│   │   │   ├── modules/  # Custom Medusa modules
│   │   │   ├── scripts/  # Seed scripts
│   │   │   └── subscribers/ # Event subscribers
│   │   └── Dockerfile
│   └── storefront/       # SvelteKit — Customer-facing UI
│       ├── src/
│       │   ├── lib/
│       │   │   ├── components/ # Svelte components
│       │   │   ├── server/     # Server-only utilities (auth, search, rate-limit)
│       │   │   ├── stores/     # Svelte stores
│       │   │   └── utils/      # Shared utilities (validation, formatting)
│       │   └── routes/         # SvelteKit routes
│       └── Dockerfile
├── infrastructure/       # Deployment configs (Coolify, CrowdSec, backups)
├── docker-compose.yml    # Local dev services (Postgres, Redis, MeiliSearch)
└── pnpm-workspace.yaml
```

## Available Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start all apps in development mode |
| `pnpm dev:backend` | Start only the backend |
| `pnpm dev:storefront` | Start only the storefront |
| `pnpm build` | Build all apps for production |
| `pnpm check` | Run type checking across all apps |
| `pnpm lint` | Run linters across all apps |
| `pnpm --filter backend run seed` | Seed the database with sample data |
| `pnpm --filter storefront test` | Run storefront unit tests |

## Deployment

Both apps have multi-stage Dockerfiles for production deployment:

```bash
# Build backend image (run from repo root)
docker build -f apps/backend/Dockerfile -t ec1-backend .

# Build storefront image (run from repo root)
docker build -f apps/storefront/Dockerfile -t ec1-storefront .
```

The backend image exposes port `9000` and the storefront image exposes port `3000`. Both run as non-root users.

See `infrastructure/` for Coolify deployment configs and CrowdSec security setup.
