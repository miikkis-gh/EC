# Stage 1: Build
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@10.30.0 --activate
WORKDIR /app
# Copy workspace root files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# Copy backend package
COPY apps/backend/ apps/backend/
# Install dependencies
RUN pnpm install --frozen-lockfile --filter backend...
# Build
RUN pnpm --filter backend run build
# Compile config for production (TypeScript not available at runtime)
RUN cp -r apps/backend/.medusa/server/* apps/backend/

# Stage 2: Production
FROM node:20-alpine
RUN corepack enable && corepack prepare pnpm@10.30.0 --activate
WORKDIR /app
# Create non-root user
RUN addgroup -S medusa && adduser -S medusa -G medusa
# Copy workspace root files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# Copy built backend
COPY --from=builder /app/apps/backend/ apps/backend/
# Install production dependencies only
RUN pnpm install --frozen-lockfile --filter backend... --prod
USER medusa
EXPOSE 9000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:9000/health || exit 1
CMD ["pnpm", "--filter", "backend", "run", "start"]
