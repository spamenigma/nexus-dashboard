FROM node:22-alpine AS base
WORKDIR /app
ENV NODE_ENV=production

# --- deps ---
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# --- builder ---
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
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder --chown=nexus:nexus /app/node_modules/.prisma ./node_modules/.prisma

RUN mkdir -p /data && chown nexus:nexus /data
VOLUME ["/data"]

USER nexus
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV DATABASE_URL=file:/data/nexus.db

# Run migrations then start
CMD sh -c "npx prisma migrate deploy && node server.js"
