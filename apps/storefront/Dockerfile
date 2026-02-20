# Stage 1: Build
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@10.30.0 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/storefront/ apps/storefront/
RUN pnpm install --frozen-lockfile --filter storefront...
RUN pnpm --filter storefront run build

# Stage 2: Production
FROM node:20-alpine
RUN corepack enable && corepack prepare pnpm@10.30.0 --activate
WORKDIR /app
RUN addgroup -S storefront && adduser -S storefront -G storefront
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/apps/storefront/package.json apps/storefront/package.json
COPY --from=builder /app/apps/storefront/build/ apps/storefront/build/
RUN pnpm install --frozen-lockfile --filter storefront... --prod
RUN chown -R storefront:storefront /app
USER storefront
EXPOSE 3000
ENV PORT=3000
ENV NODE_ENV=production
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1
CMD ["node", "apps/storefront/build/index.js"]
