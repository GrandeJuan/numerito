# Fargate task image for ARCA calendar scraping.
# Runs the standalone scraper-entrypoint.ts with Playwright + Chromium.
#
# Build from repo root:
#   docker build -f infra/fargate-scraper/Dockerfile -t numerito-scraper .

FROM node:20-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates fonts-liberation libglib2.0-0 libnss3 libnspr4 \
    libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libdbus-1-3 \
    libxcb1 libxkbcommon0 libx11-6 libxcomposite1 libxdamage1 \
    libxext6 libxfixes3 libxrandr2 libgbm1 libpango-1.0-0 \
    libcairo2 libasound2 && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ── Install dependencies ──
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json apps/backend/
COPY packages/shared/package.json packages/shared/
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# ── Build shared package ──
FROM deps AS shared-build
COPY packages/shared packages/shared
RUN cd packages/shared && npm run build

# ── Build backend (includes scraper entry point) ──
FROM deps AS backend-build
COPY --from=shared-build /app/packages/shared/dist packages/shared/dist
COPY apps/backend apps/backend
RUN cd apps/backend && npx nest build

# ── Install Playwright browsers ──
FROM base AS playwright
RUN npm install playwright@latest && npx playwright install chromium

# ── Final image ──
FROM base AS runtime
WORKDIR /app

COPY --from=backend-build /app/apps/backend/dist ./dist
COPY --from=backend-build /app/node_modules ./node_modules
COPY --from=backend-build /app/packages/shared/dist ./packages/shared/dist
COPY --from=playwright /root/.cache/ms-playwright /root/.cache/ms-playwright

# Playwright needs to find its browsers
ENV PLAYWRIGHT_BROWSERS_PATH=/root/.cache/ms-playwright

# Required env vars (set via ECS task definition):
#   BACKEND_URL       — e.g. https://api.numerito.app
#   INGESTA_SECRET    — shared secret for webhook auth
#   FUENTE            — ARCA (default)
#   MESES_ADELANTE    — 0 (default)
#   DISPARADOR        — SCHEDULE (default)

ENTRYPOINT ["node", "dist/integraciones/infrastructure/fargate/scraper-entrypoint.js"]
