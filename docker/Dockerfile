# Imagen de producción de Cubiletica (docs/04 §Despliegue).
# Multi-stage: deps → build → runner standalone con usuario no root.
# Contexto de build: la RAÍZ del repo (ver docker/docker-compose.yml).

# ---------- deps ----------
FROM node:22-alpine AS deps
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# ---------- build ----------
FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Dummies SOLO para `next build` (mismo patrón que ci.yml): la colecta de
# page data importa src/db y better-auth, que validan su config al cargar.
# Los valores reales llegan en runtime vía docker compose.
ENV DATABASE_URL="postgres://dummy:dummy@localhost:5432/dummy" \
    BETTER_AUTH_SECRET="0000000000000000000000000000000000000000000000000000000000000000" \
    BETTER_AUTH_URL="http://localhost:3000" \
    NEXT_PUBLIC_APP_URL="http://localhost:3000"
RUN pnpm build && pnpm build:prod-scripts

# ---------- runner ----------
FROM node:22-alpine AS runner
ENV NODE_ENV=production \
    HOSTNAME=0.0.0.0 \
    PORT=3000
WORKDIR /app
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/drizzle ./drizzle
COPY --from=build --chown=nextjs:nodejs /app/docker/dist/migrate.mjs ./migrate.mjs
COPY --from=build --chown=nextjs:nodejs /app/docker/dist/seed.mjs ./seed.mjs
COPY --from=build --chown=nextjs:nodejs /app/docker/dist/apply-content.mjs ./apply-content.mjs
# Cuerpos de lección: content:apply los lee del disco en runtime (no van en
# el bundle de esbuild), así que el directorio viaja a la imagen.
COPY --from=build --chown=nextjs:nodejs /app/content ./content

# Punto de montaje de subidas con dueño correcto (docs/04 §Patrones 7);
# el volumen nombrado hereda estos permisos al inicializarse.
RUN mkdir -p /data/uploads && chown -R nextjs:nodejs /data

USER nextjs
EXPOSE 3000

# Arranque: migrate → seed → content:apply → server. Los tres pasos de
# datos son idempotentes (migrate salta lo aplicado; seed upsertea por
# clave natural; content:apply solo pisa cuerpos "[REDACTAR]"/vacíos), así
# que es seguro en cada arranque. Encadenados con && : si alguno falla, el
# contenedor no arranca (mejor un fallo visible que servir lecciones sin
# cuerpo). El seed exige SEED_ADMIN_EMAIL/PASSWORD (ver docker/.env.example).
CMD ["sh", "-c", "node migrate.mjs && node seed.mjs && node apply-content.mjs && exec node server.js"]
