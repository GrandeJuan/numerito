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
# Shared: copy source only (preserve node_modules from deps)
COPY packages/shared/src/ packages/shared/src/
COPY packages/shared/tsconfig.json packages/shared/
RUN pnpm --filter @numerito/shared run build
# Backend: copy source only (preserve node_modules from deps)
COPY apps/backend/src/ apps/backend/src/
COPY apps/backend/tsconfig.json apps/backend/tsconfig.build.json apps/backend/nest-cli.json apps/backend/
RUN pnpm --filter @numerito/backend run build

# ---- Production ----
FROM base AS production
ENV NODE_ENV=production
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=build /app/apps/backend/dist ./apps/backend/dist
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=build /app/apps/backend/package.json ./apps/backend/package.json
COPY pnpm-workspace.yaml package.json ./

WORKDIR /app/apps/backend
EXPOSE 3001
CMD ["node", "--experimental-require-module", "dist/main"]
