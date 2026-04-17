# Numerito — ERP Contable Argentino

## Vision
ERP contable argentino para estudios contables. SaaS multi-tenant.
Cada "estudio" es un tenant con sus propios clientes, obligaciones, facturacion, etc.

## Stack
- **Monorepo:** Turborepo con pnpm workspaces
- **Backend:** NestJS + MikroORM + PostgreSQL (REST API)
- **Frontend:** Next.js (App Router) + shadcn/ui + Tailwind CSS
- **Shared:** Package con types, validaciones Zod, constantes de dominio
- **Infra:** Docker Compose (dev), AWS ECS/Fargate (prod), Terraform

## Bounded Contexts (10)
1. **IAM** — Identidad, autenticacion, roles y permisos
2. **Tenant** — Estudios contables (multi-tenancy)
3. **Clientes** — Clientes del estudio (personas fisicas/juridicas)
4. **Obligaciones** — Vencimientos fiscales, calendario, alertas
5. **Contabilidad** — Libros contables, asientos, balances
6. **Nomina** — Empleados de clientes, liquidacion, recibos
7. **Documentos** — Repositorio documental por cliente (S3)
8. **Tareas** — Gestion interna del estudio, Kanban, horas
9. **Facturacion** — Facturacion del estudio a sus clientes
10. **Integraciones** — ARCA, ARBA, AGIP, notificaciones

## Read-Model Contexts

Three contexts — `administracion`, `dashboard`, `portal` — exist outside the bounded context model. They are **read-model contexts**: query-only modules that aggregate data from multiple bounded contexts for display.

### Rules

Read-model contexts **may**:
- Compose public views exposed by source contexts via `{context}/application/public-views.ts`
- Run raw SQL via `em.getConnection().execute()` for complex cross-context queries
- Use `EntityManager` directly for simple finds and counts
- Import their own schemas (e.g., administracion importing its own `dashboard-snapshot.schema.ts`)

Read-model contexts **must not**:
- Import MikroORM schema entities (`*.schema.ts`) from other bounded contexts — use public views instead
- Import domain entities (`/{context}/domain/entities/`)
- Import application services, commands, or queries from other contexts
- Contain domain entities, aggregates, or domain events of their own
- Perform write operations — they are strictly read-only

### Public View Pattern

Source contexts expose stable read projections via `application/views/*.view.ts`, re-exported through `application/public-views.ts`. Each view is an `@Injectable()` NestJS provider with a typed `execute()` method returning plain DTOs. Read-model contexts inject views via Symbol tokens and compose them instead of reaching into source schemas.

```
# Source context exposes views:
apps/backend/src/{source-context}/
  application/
    views/               ← @Injectable() view providers
    public-views.ts      ← Symbol tokens + type exports (anti-corruption barrel)

# Read-model context composes views:
apps/backend/src/{read-model-context}/
  application/queries/   ← query handlers composing injected views
  infrastructure/        ← controllers (thin HTTP adapters)
  {context}.module.ts    ← imports source modules, injects view tokens
```

### When to Use

Use a read-model context when you need to **aggregate data from multiple bounded contexts** into a single response (dashboards, admin panels, portal summaries). If a query only touches one context, it belongs in that context's query layer instead.

### Enforcement

`architecture.spec.ts` enforces read-model rules under a separate `READ_MODEL_CONTEXTS` list:
- Read-model contexts **cannot** import cross-context schemas — the `ReadModelViewContract` test fails CI on any violation
- Public views **must** be exported from `public-views.ts` — the barrel enforcement test fails CI on any view not in the barrel
- Standard bounded contexts have stricter isolation; read-model contexts get view-composition rules

## Domain Event Bus

### Reliability Guarantees

The event bus (`EventEmitterBus`) is **in-process and fire-and-forget**. It wraps NestJS `EventEmitter2` — events are dispatched synchronously within the same Node.js process. There is no persistence, no retry, and no ordering guarantee beyond single-threaded dispatch.

- If the process crashes between event emission and listener execution, the event is **lost**.
- If a listener throws, the error is caught — other listeners still run, but the failed side effect is **not retried**.
- Events are not durable — there is no outbox, no message broker, no replay capability.

### When to Use Events

**Appropriate:**
- Read-model cache invalidation (e.g., marking a dashboard snapshot as stale)
- Non-critical side effects (e.g., logging, metrics, in-memory projection updates)
- Loose coupling between bounded contexts for informational notifications

**Not appropriate:**
- Business-critical workflows that must not be lost (use explicit service calls or a persistent outbox pattern)
- Workflows requiring guaranteed delivery, ordering, or exactly-once semantics
- Cross-service communication (events are in-process only)

### Publishing Pattern

1. Domain entity collects events via `addDomainEvent()` during state transitions.
2. Command handler calls `repository.save(entity)`.
3. After successful save, handler calls `eventBus.publishAll(entity.getDomainEvents())` and `entity.clearDomainEvents()`.
4. **Controllers never import or interact with the event bus.**

Reference implementation: `RegistrarUsuarioHandler` in IAM.

### Anti-Corruption Layer

Each publishing context exports public event names and payload interfaces from `{context}/application/public-events.ts`. Subscribers import these — never internal domain event classes.

### Event Catalog

| Event Name | Context | Emitter (entity method) | Publisher (handler) | Listeners |
|---|---|---|---|---|
| `iam.usuario-registrado` | IAM | `Usuario.create()` | `RegistrarUsuarioHandler` | `DashboardStatsListener` |
| `estudio.subscripcion-creada` | Estudio | `Subscripcion.create()` | _(published via aggregate events after save)_ | `DashboardStatsListener` |
| `estudio.subscripcion-renovada` | Estudio | `Subscripcion.renovar()` | `RenovarSubscripcionHandler` | `DashboardStatsListener` |
| `estudio.subscripcion-cancelada` | Estudio | `Subscripcion.cancelar()` | `CancelarSubscripcionHandler` | `DashboardStatsListener` |
| `estudio.subscripcion-vencida` | Estudio | `Subscripcion.marcarVencida()` | `MarcarSubscripcionVencidaHandler` | `DashboardStatsListener` |
| `obligaciones.vencimiento-cumplido` | Obligaciones | `Vencimiento.presentar()` | `PresentarVencimientoHandler` | `DashboardStatsListener` |
| `obligaciones.vencimiento-vencido` | Obligaciones | `Vencimiento.marcarVencido()` | `MarcarVencidoHandler` | `DashboardStatsListener` |

**Contexts without events:** Clientes, Contabilidad, Nomina, Documentos, Tareas, Facturacion, Integraciones.

### Key Files

- Event bus interface: `shared/domain/event-bus.ts`
- Event bus implementation: `shared/infrastructure/services/event-emitter-bus.ts`
- Global module: `shared/infrastructure/event-bus.module.ts`
- Base entity (event collection): `shared/domain/base.entity.ts`
- Public event contracts: `{context}/application/public-events.ts`
- Sole listener: `administracion/application/listeners/dashboard-stats.listener.ts`

## Tenant Boundary (Multi-tenancy enforcement)

Tenant scoping is a **structural invariant** enforced by `architecture.spec.ts`. The architecture test fails CI on any violation.

### How it works

1. `RequestContextMiddleware` reads `x-estudio-id` header from every request.
2. `EstudioPrincipalInterceptor` builds a typed `EstudioPrincipal` (`{ estudioId, userId, roles }`) from the header + authenticated user.
3. Controllers receive it via `@Principal()` decorator and thread it to handlers.
4. Every command/query handler takes `EstudioPrincipal` as its first parameter.
5. Every tenant-aware repository method takes `EstudioPrincipal` as its first parameter — the architecture test enforces this.

### Key rules

- **New code must use `@Principal()`** — the legacy `@EstudioId()` decorator is deprecated.
- **Repository methods must take `EstudioPrincipal` as first param** — no ambient `getTenantId()` calls in new code.
- **Cross-tenant operations** use `GlobalRepository` (admin dashboards, reference data, system jobs).
- **Architecture test** blocks CI if a bounded-context tenant-aware repo method omits the principal.

### Key files

- Principal type: `shared/domain/estudio-principal.ts`
- Interceptor: `shared/infrastructure/interceptors/estudio-principal.interceptor.ts`
- Decorator: `shared/infrastructure/decorators/estudio-principal.decorator.ts`
- Repository base: `shared/domain/tenant-aware.repository.ts`
- Global escape: `shared/domain/global.repository.ts`
- Architecture test: `shared/architecture/architecture.spec.ts` (TenantBoundary section)

## Reglas Generales
- **Idioma de negocio:** Espanol para entidades de dominio (Cliente, Vencimiento, Factura, etc.)
- **Idioma tecnico:** Ingles para infra, config, utils, nombres de archivos tecnicos
- **Estructura:** Monorepo con `apps/backend`, `apps/frontend`, `packages/shared`
- **Branch strategy:** Feature branches desde `main`, PRs con review
- **Commits:** Descriptivos, sin mencionar herramientas de IA
- **Tests:** Obligatorios antes de merge. Usar `/tdd` para features.
