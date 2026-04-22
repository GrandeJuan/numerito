# Fargate task image for calendar scraping (ARCA / ARBA / AGIP / BCRA).
# Shares the same build pipeline as apps/backend/Dockerfile; differs only in
# the runtime layer, which adds Playwright + Chromium and a scraper entrypoint.

# ---- Base ----
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

# ---- Dependencies ----
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/backend/package.json apps/backend/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile

# ---- Build ----
FROM deps AS build
COPY packages/shared/src/ packages/shared/src/
COPY packages/shared/tsconfig.json packages/shared/
RUN pnpm --filter @numerito/shared run build
COPY apps/backend/src/ apps/backend/src/
COPY apps/backend/tsconfig.json apps/backend/tsconfig.build.json apps/backend/nest-cli.json apps/backend/
RUN pnpm --filter @numerito/backend run build

# ---- Playwright browsers (cached layer, isolated OS deps) ----
FROM node:22-slim AS playwright-browsers
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates wget && rm -rf /var/lib/apt/lists/*
RUN npx -y playwright@1.59.1 install chromium --with-deps

# ---- Runtime ----
# Debian slim because Chromium's runtime libs are non-trivial on Alpine.
FROM node:22-slim AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates fonts-liberation libglib2.0-0 libnss3 libnspr4 \
    libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libdbus-1-3 \
    libxcb1 libxkbcommon0 libx11-6 libxcomposite1 libxdamage1 \
    libxext6 libxfixes3 libxrandr2 libgbm1 libpango-1.0-0 \
    libcairo2 libasound2 && \
    rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
WORKDIR /app

COPY pnpm-workspace.yaml package.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=build /app/apps/backend/dist ./apps/backend/dist
COPY --from=build /app/apps/backend/package.json ./apps/backend/package.json
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=playwright-browsers /root/.cache/ms-playwright /ms-playwright

WORKDIR /app/apps/backend

# Required env vars:
#   BACKEND_URL       — e.g. https://api.numerito.app or http://host.docker.internal:5101
#   INGESTA_SECRET    — shared secret for webhook auth
#   FUENTE            — ARCA | ARBA | AGIP | BCRA_FERIADOS
#   MESES_ADELANTE    — 0 (default)
#   DISPARADOR        — MANUAL | SCHEDULE (default SCHEDULE)
ENTRYPOINT ["node", "--experimental-require-module", "dist/integraciones/infrastructure/fargate/scraper-entrypoint"]
