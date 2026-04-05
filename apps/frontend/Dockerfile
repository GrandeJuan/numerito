# ---- Base ----
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

# ---- Dependencies ----
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/frontend/package.json apps/frontend/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile

# ---- Build ----
FROM deps AS build
ARG NEXT_PUBLIC_API_URL=http://localhost:5101/api
ARG NEXT_PUBLIC_SHOW_DEV_USERS=false
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_SHOW_DEV_USERS=${NEXT_PUBLIC_SHOW_DEV_USERS}

# Shared: copy source only (preserve node_modules from deps)
COPY packages/shared/src/ packages/shared/src/
COPY packages/shared/tsconfig.json packages/shared/
RUN pnpm --filter @numerito/shared run build
# Frontend: copy source only (preserve node_modules from deps)
COPY apps/frontend/src/ apps/frontend/src/
COPY apps/frontend/next.config.ts apps/frontend/tsconfig.json apps/frontend/postcss.config.mjs apps/frontend/
COPY apps/frontend/components.json apps/frontend/
RUN pnpm --filter @numerito/frontend run build

# ---- Runtime ----
FROM base AS production
ENV NODE_ENV=production
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/frontend/node_modules ./apps/frontend/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=build /app/apps/frontend/.next ./apps/frontend/.next
COPY --from=build /app/apps/frontend/package.json ./apps/frontend/package.json
COPY --from=build /app/apps/frontend/next.config.ts ./apps/frontend/next.config.ts
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/packages/shared/package.json ./packages/shared/package.json
COPY pnpm-workspace.yaml package.json ./

WORKDIR /app/apps/frontend
EXPOSE 3000
CMD ["npx", "next", "start", "--port", "3000"]
