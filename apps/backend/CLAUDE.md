# Backend — NestJS + MikroORM

## DDD Obligatorio
Cada bounded context se implementa como un modulo NestJS con:
- `domain/` — Entities, Value Objects, Aggregates, Domain Events, Repository interfaces
- `application/` — Use Cases (servicios de aplicacion), DTOs, Commands/Queries
- `infrastructure/` — Implementaciones de repositorios (MikroORM), controllers REST, adaptadores externos

### Reglas DDD
- Entities tienen identidad (id). Value Objects son inmutables y se comparan por valor.
- Aggregate Root es el unico punto de entrada para modificar el aggregate.
- Domain Events para comunicacion entre bounded contexts (no llamadas directas).
- Repository interfaces en `domain/`, implementaciones en `infrastructure/`.

## Clean Architecture
`domain/ -> application/ -> infrastructure/` (la dependencia NUNCA va al reves)
- Domain no importa de application ni infrastructure
- Application solo importa de domain
- Infrastructure puede importar de ambos

## SOLID
- **S:** Una clase, una responsabilidad
- **O:** Extender comportamiento sin modificar codigo existente
- **L:** Subtipos sustituibles por sus tipos base
- **I:** Interfaces pequenas y especificas
- **D:** Depender de abstracciones, no de implementaciones concretas

## MikroORM
- Unit of Work pattern: `em.flush()` al final de la transaccion
- Identity Map: una entidad cargada una sola vez por request
- Decoradores: `@Entity()`, `@Property()`, `@ManyToOne()`, etc.
- Migraciones obligatorias para cambios de schema

## TDD
- Siempre ejecutar `/tdd` — tests primero, codigo despues
- Tests unitarios para domain y application
- Tests de integracion para infrastructure (contra DB real, no mocks)

## Estructura de un Bounded Context
```
src/
  {contexto}/
    domain/
      entities/
      value-objects/
      events/
      repositories/     # interfaces
    application/
      commands/
      queries/
      dtos/
      services/
    infrastructure/
      persistence/      # implementaciones MikroORM
      controllers/      # REST endpoints
      adapters/         # servicios externos
    {contexto}.module.ts
```

## Tenant Context (Multi-tenancy)

### Current convention: EstudioPrincipal (Phase 3 — enforced)

Tenant scoping is a **structural invariant**, not a convention. The architecture test (`architecture.spec.ts`) enforces it as a blocking assertion — CI fails on any violation.

- **Principal:** `EstudioPrincipal` (`shared/domain/estudio-principal.ts`) is a typed value object with `estudioId`, `userId`, and `roles`. Produced once per request by `EstudioPrincipalInterceptor`.
- **Controllers:** Use `@Principal()` param decorator (`shared/infrastructure/decorators/estudio-principal.decorator.ts`) to receive the typed principal. Thread it to command/query handlers as the first parameter.
- **Handlers:** Every command and query handler receives `EstudioPrincipal` as its first parameter. Extract `principal.estudioId` when creating domain entities.
- **Repositories:** Tenant-aware repositories extend `TenantAwareRepository` and accept `EstudioPrincipal` as the first parameter on every public method. The principal provides `estudioId` for query filters and save-time ownership checks.
- **Global repositories:** Cross-tenant operations (admin, reference data) extend `GlobalRepository`. No principal parameter required. Architecture test allows this explicitly.
- **Middleware:** `RequestContextMiddleware` reads `x-estudio-id` header and populates the request context. The interceptor builds the principal from header + authenticated user.
- **Constant:** `ESTUDIO_ID_HEADER` is defined once in `shared/infrastructure/middleware/request-context.middleware.ts`.
- **Rule:** Never create context-specific middleware or decorators for tenant injection. All tenant context flows through `RequestContextMiddleware` → `EstudioPrincipalInterceptor` → `@Principal()`.

### Deprecated patterns (do NOT use in new code)

- ~~`@EstudioId()` decorator~~ — replaced by `@Principal()`. Marked `@deprecated`.
- ~~`getTenantId()` on `TenantAwareRepository`~~ — replaced by explicit `EstudioPrincipal` parameter. Marked `@deprecated`. Only retained for non-bounded-context repos not yet migrated (e.g., notificaciones).
- ~~Ambient `RequestContextService.estudioId` reads in application layer~~ — forbidden. All tenant scoping flows through the principal.

## Convenciones
- Archivos: `kebab-case.ts` (ej: `tipo-obligacion.vo.ts`)
- Clases: `PascalCase` (ej: `TipoObligacion`)
- Sufijos: `.entity.ts`, `.vo.ts`, `.event.ts`, `.repository.ts`, `.service.ts`, `.controller.ts`
- DTOs: `.dto.ts` con validacion class-validator
- Puerto backend: 3001
