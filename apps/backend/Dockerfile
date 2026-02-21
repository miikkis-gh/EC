# Stage 1: Build
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@10.30.0 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/ apps/backend/
RUN pnpm install --frozen-lockfile --filter backend...
ARG MEDUSA_BACKEND_URL
ENV MEDUSA_BACKEND_URL=$MEDUSA_BACKEND_URL
RUN pnpm --filter backend run build
RUN cp apps/backend/.medusa/server/medusa-config.js apps/backend/medusa-config.js && \
    cp apps/backend/.medusa/server/instrumentation.js apps/backend/instrumentation.js 2>/dev/null || true
RUN test -f apps/backend/.medusa/server/public/admin/index.html || \
    (echo "ERROR: Admin build output not found. medusa build did not produce admin frontend." && exit 1)
RUN cp -r apps/backend/.medusa/server/public apps/backend/public
RUN rm -rf apps/backend/src

# Stage 2: Production
FROM node:20-alpine
RUN corepack enable && corepack prepare pnpm@10.30.0 --activate
WORKDIR /app
RUN addgroup -S medusa && adduser -S medusa -G medusa
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY --from=builder /app/apps/backend/ apps/backend/
RUN pnpm install --frozen-lockfile --filter backend... --prod
RUN mkdir -p /app/apps/backend/uploads && chown -R medusa:medusa /app
VOLUME ["/app/apps/backend/uploads"]
USER medusa
EXPOSE 9000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:9000/health || exit 1
CMD ["sh", "-c", "cd /app/apps/backend && npx medusa db:migrate && pnpm --filter backend run start"]
