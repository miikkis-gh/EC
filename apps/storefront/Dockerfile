# Stage 1: Build
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@10.30.0 --activate

WORKDIR /app

# Copy workspace root files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy storefront package
COPY apps/storefront/ apps/storefront/

# Install dependencies
RUN pnpm install --frozen-lockfile --filter storefront...

# Build (adapter-node output goes to apps/storefront/build/)
RUN pnpm --filter storefront run build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Create non-root user
RUN addgroup -S storefront && adduser -S storefront -G storefront

# Copy built output from adapter-node
COPY --from=builder /app/apps/storefront/build/ ./build/
COPY --from=builder /app/apps/storefront/package.json ./

# Install production dependencies only
RUN corepack enable && corepack prepare pnpm@10.30.0 --activate && \
    pnpm install --prod --frozen-lockfile

USER storefront

EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

CMD ["node", "build/index.js"]
