# Architecture Refactor — Issue #136

Tracer bullet plan for the 8 workstreams. Each phase is independently shippable.

---

## Phase 1: Tenant-Aware Repository Migration (Priority 1 — Security) ✅

**Goal:** Every tenant-scoped query auto-filters by `estudioId`; no handler can accidentally leak cross-tenant data.

Infrastructure already done: `TenantAwareRepository<T>`, `GlobalRepository<T>`, `RequestContextService`, `RequestContextMiddleware`.
Reference impl: `MikroOrmClienteRepository` (clientes context).

### Tracer bullet

- [x] Migrate 1 repo per context to prove the pattern works everywhere (contabilidad → `MikroOrmAsientoContableRepository`)
- [x] Migrate remaining tenant-scoped repos (14 total):
  - [x] contabilidad: `MikroOrmLibroContableRepository`
  - [x] documentos: `MikroOrmDocumentoRepository`
  - [x] estudio: `MikroOrmSubscripcionRepository`
  - [x] facturacion: `MikroOrmFacturaRepository`, `MikroOrmPagoRepository`
  - [x] iam: `MikroOrmUsuarioEstudioRepository`
  - [x] integraciones: `MikroOrmCredencialFiscalRepository`, `MikroOrmNotificacionFiscalRepository`
  - [x] nomina: `MikroOrmEmpleadoRepository`
  - [x] notificaciones: `MikroOrmNotificacionRepository`
  - [x] obligaciones: `MikroOrmAlertaConfigRepository`, `MikroOrmVencimientoRepository`
  - [x] tareas: `MikroOrmTareaRepository`
- [x] Migrate global repos to `GlobalRepository<T>`:
  - [x] administracion: `MikroOrmAdminPlanRepository`
  - [x] estudio: `MikroOrmEstudioRepository`, `MikroOrmPlanRepository`
  - [x] iam: `MikroOrmUsuarioRepository`, `MikroOrmResetTokenRepository`, `MikroOrmRolPermisoRepository`, `MikroOrmTotpSecretRepository`, `MikroOrmSesionRepository`
  - [x] integraciones: `MikroOrmOrganismoFiscalRepository`
  - [ ] obligaciones: `MikroOrmReglaVencimientoRepository` (file does not exist yet)
- [x] Update domain interfaces to extend `BaseRepository<T>` consistently
- [x] Update command/query handlers that pass explicit `estudioId` to repos — remove the param
- [ ] Integration tests: create data in Estudio A, verify invisible from Estudio B
- [x] Typecheck + all existing tests still green (95 suites, 552 tests)

---

## Phase 2: Frontend Data Hook + Page State Guard (Priority 2 — Dev Velocity) ✅

**Goal:** One hook for data-fetching with estudio context. One guard component for loading/error/no-estudio states.

### Tracer bullet

- [ ] Create `useFetchWithEstudio<T>(endpoint, options?)` hook returning `{ data, loading, error, refetch }`
- [ ] Create `<PageStateGuard>` component (handles no-estudio, loading, error states)
- [ ] Create `lib/formatters.ts` with `formatCurrency()`, `formatFecha()`, `relativeTime()` — tested
- [x] Refactor 1 page as proof (`/dashboard/clientes`) to use hook + guard
- [x] Refactor remaining 9 pages (dashboard home, contabilidad, facturacion, obligaciones, tareas, configuracion, admin, portal)
- [x] Remove duplicate formatter definitions from all pages + notification-bell component
- [x] Build + 238 tests green

---

## Phase 3: Shared UI Primitives (Priority 3 — Consistency)

**Goal:** Reusable components for repeated UI patterns, backed by design tokens.

### Tracer bullet

- [ ] `<KpiCard icon label value />` — unit tested
- [ ] `<DataTable columns data emptyMessage />` — unit tested
- [ ] `<StatusBadge status />`, `<RolBadge rol />`, `<PrioridadBadge prioridad />` — unit tested
- [ ] `<FilterBar>` with `<SearchInput>` + `<FilterSelect>` — unit tested
- [ ] Move `ESTADO_LABELS`, `ROL_LABELS`, `PRIORIDAD_LABELS` to `@numerito/shared`
- [ ] Refactor all pages to use new components (remove inline Tailwind duplication)
- [ ] Typecheck + tests green

---

## Phase 4: Inter-Context Event Bus (Priority 4 — Decoupling)

**Goal:** Bounded contexts communicate via domain events, not direct entity imports.

### Tracer bullet

- [ ] Install `@nestjs/event-emitter` + configure `EventEmitterModule` in AppModule
- [ ] Publish 1 event end-to-end as proof (e.g., `UsuarioRegistrado` from IAM registration flow)
- [ ] Publish remaining domain events from command handlers
- [ ] Replace dashboard 151-line raw SQL with event-driven read model (denormalized stats table)
- [ ] Admin dashboard: subscribe to events, maintain admin-specific aggregates
- [ ] Remove cross-context entity imports — contexts expose public interfaces only
- [ ] Typecheck + tests green

---

## Phase 5: Auth Guard Composition (Priority 5 — Security)

**Goal:** Composite guards that enforce correct ordering. Can't forget JWT before role check.

### Tracer bullet

- [ ] Create `AuthenticatedGuard` = JWT validation (always first)
- [ ] Create `AdminGuard` extends `AuthenticatedGuard` + checks `SUPERADMIN`
- [ ] Create `EstudioMemberGuard` extends `AuthenticatedGuard` + validates user belongs to estudio
- [ ] Unit tests: no token → 401, wrong role → 403, valid → pass
- [ ] Migrate controllers from `@UseGuards(JwtAuthGuard, SuperAdminGuard)` stacking to composite guards
- [ ] Typecheck + tests green

---

## Phase 6: API Response Normalization (Priority 6 — Contract)

**Goal:** Every endpoint returns `{ data, meta? }` or `{ error, statusCode }`. Frontend has one parser.

Already done: `ResponseWrapperInterceptor`, `ApiResponse` types.

### Tracer bullet

- [ ] Audit all controllers for edge cases where interceptor doesn't wrap correctly
- [ ] Frontend: create `parseApiResponse<T>(res)` utility
- [ ] Remove all `body.data ?? body` fallbacks from pages
- [ ] Add Zod schemas to `@numerito/shared` for critical DTOs
- [ ] Frontend validates responses against Zod schemas in dev mode
- [ ] Typecheck + tests green

---

## Phase 7: Cross-Cutting Infrastructure (Priority 7 — Observability)

**Goal:** Structured JSON logging with correlation IDs on every log entry.

### Tracer bullet

- [ ] Install `nestjs-pino` + configure structured JSON logging
- [ ] Propagate correlation ID from `RequestContextService` into all log entries
- [ ] Replace all `console.log()` with structured logger calls
- [ ] `GlobalExceptionFilter` includes correlation ID in error responses
- [ ] Typecheck + tests green

---

## Phase 8: Test Coverage Push (Across all phases)

**Goal:** New modules at 100% boundary coverage; existing modules toward 80%+.

### Tracer bullet

- [ ] Tenant isolation integration tests (2 estudios, data doesn't cross)
- [ ] Frontend hooks: unit tests with mocked apiFetch
- [ ] UI primitives: render contract tests (correct classes, aria labels)
- [ ] Event bus: publish/subscribe contract tests
- [ ] Guards: token/role combination tests
- [ ] API contract: response shape snapshot tests + Zod validation
- [ ] Formatters: locale edge case tests
- [ ] Coverage report: improve from 36% toward 80%+

---

## Progress Log

| Date | Phase | What was done |
|------|-------|---------------|
| 2026-04-13 | Phase 1 | Migrated all 15 tenant-scoped repos to TenantAwareRepository, 9 global repos to GlobalRepository. Updated all controllers, queries, and 95 test suites. Build + 552 tests green. |
| 2026-04-13 | Phase 2 | Created useFetchWithEstudio hook, PageStateGuard component, shared formatters. Refactored 10 pages + notification-bell. Removed all duplicate formatters. Build + 238 frontend tests green. |
