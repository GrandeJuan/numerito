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
- Import MikroORM schema entities (`*.schema.ts`) from other contexts' `infrastructure/persistence/` layers
- Run raw SQL via `em.getConnection().execute()` for complex cross-context queries
- Use `EntityManager` directly for simple finds and counts

Read-model contexts **must not**:
- Import domain entities (`/{context}/domain/entities/`)
- Import application services, commands, or queries from other contexts
- Contain domain entities, aggregates, or domain events of their own
- Perform write operations — they are strictly read-only

### Pattern

Each read-model context has a flat structure with query services and controllers — no domain layer. Query services receive `EntityManager` via DI and return plain DTOs.

```
apps/backend/src/{context}/
  application/queries/   ← query handlers owning the SQL
  infrastructure/        ← controllers (thin HTTP adapters)
  {context}.module.ts
```

### When to Use

Use a read-model context when you need to **aggregate data from multiple bounded contexts** into a single response (dashboards, admin panels, portal summaries). If a query only touches one context, it belongs in that context's query layer instead.

### Enforcement

`architecture.spec.ts` enforces read-model rules under a separate `READ_MODEL_CONTEXTS` list. Standard bounded contexts have stricter isolation; read-model contexts get relaxed import rules but are still tested.

## Reglas Generales
- **Idioma de negocio:** Espanol para entidades de dominio (Cliente, Vencimiento, Factura, etc.)
- **Idioma tecnico:** Ingles para infra, config, utils, nombres de archivos tecnicos
- **Estructura:** Monorepo con `apps/backend`, `apps/frontend`, `packages/shared`
- **Branch strategy:** Feature branches desde `main`, PRs con review
- **Commits:** Descriptivos, sin mencionar herramientas de IA
- **Tests:** Obligatorios antes de merge. Usar `/tdd` para features.
