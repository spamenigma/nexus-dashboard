FROM node:22-alpine AS base
WORKDIR /app
ENV NODE_ENV=production

# --- deps (production only, for the runner) ---
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# --- builder (needs dev deps for Tailwind PostCSS + Prisma CLI) ---
FROM base AS builder
COPY package.json package-lock.json ./
RUN NODE_ENV=development npm ci
COPY . .
RUN npx prisma generate
ENV DATABASE_URL=file:/data/nexus.db
RUN npm run build

# --- runner ---
FROM base AS runner
RUN addgroup -S nexus && adduser -S nexus -G nexus
WORKDIR /app

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/lib/generated ./lib/generated
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts

RUN mkdir -p /data && chown -R nexus:nexus /data /app

VOLUME ["/data"]

USER nexus
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV DATABASE_URL=file:/data/nexus.db

# Run migrations then start
CMD sh -c "node scripts/migrate.mjs && node server.js"
