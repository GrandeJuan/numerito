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
Single mechanism for tenant injection — do NOT create alternatives:
- **Middleware:** `RequestContextMiddleware` (global, registered in `RequestContextModule`) reads `x-estudio-id` header and sets both `RequestContextService.estudioId` and `req.estudioId`
- **Repositories:** Extend `TenantAwareRepository`, which reads from `RequestContextService` (injected via `REQUEST_CONTEXT` symbol). All queries auto-filter by tenant.
- **Controllers:** Use `@EstudioId()` param decorator (from `shared/infrastructure/decorators/`) to extract `estudioId` from the request. Pass it as a plain string to command handlers.
- **Constant:** `ESTUDIO_ID_HEADER` is defined once in `shared/infrastructure/middleware/request-context.middleware.ts`
- **Rule:** Never create context-specific middleware or decorators for tenant injection. All tenant context flows through `RequestContextMiddleware`.

## Convenciones
- Archivos: `kebab-case.ts` (ej: `tipo-obligacion.vo.ts`)
- Clases: `PascalCase` (ej: `TipoObligacion`)
- Sufijos: `.entity.ts`, `.vo.ts`, `.event.ts`, `.repository.ts`, `.service.ts`, `.controller.ts`
- DTOs: `.dto.ts` con validacion class-validator
- Puerto backend: 3001
