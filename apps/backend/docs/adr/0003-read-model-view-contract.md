# ADR 0003 — Read-model view contract shape

**Status:** Accepted
**Date:** 2026-04-16
**Issue:** #208 (PRD #196)
**Approved by:** Federico Rossi (2026-04-16)

## Context

Three read-model contexts — `administracion`, `dashboard`, `portal` —
aggregate data across bounded contexts for display. Today they reach
directly into source-context MikroORM schema entities: the dashboard
query handler imports `ClienteEntity`, `VencimientoEntity`, and
`TareaEntity` from
`{context}/infrastructure/persistence/*.schema.ts` and runs EM finds
and raw SQL against them. CLAUDE.md explicitly permits this, and the
architecture spec allows it under `READ_MODEL_CONTEXTS` (see
`apps/backend/src/shared/architecture/architecture.spec.ts`, rules
"read-model contexts must not import from domain layer…" and "…
application services, commands, or queries…").

That permission is pragmatic but leaves a real coupling unaddressed:

- **Schema changes ripple silently.** Renaming
  `Cliente.razonSocial` → `Cliente.nombreFantasia` breaks dashboards
  in a different context — TypeScript catches it only because the
  import is direct. There is no contract.
- **Enum semantics leak across contexts.** The dashboard query
  joins on `estado_vencimiento.codigo = 'PENDIENTE'`; renaming the
  enum in obligaciones silently breaks the dashboard.
- **Performance tuning happens in the wrong place.** The source
  context does not own its read shape; the dashboard reaches in,
  picks columns, joins. Any optimisation lives in the consumer.
- **The pattern doesn't scale.** A fourth read-model context
  (e.g., a billing summary) means another consumer of every source
  schema.

PRD #196 introduces **public read views** as the read-side analogue
of `public-events.ts`: each source context exposes a small, stable
set of projections; read-model contexts compose them instead of
joining source schemas. This ADR pins down the view contract's
shape so that subsequent slices (#222 tracer-bullet
`clienteSummaryView`, #223 `vencimientosProximosView`, #224
`tareasPendientesView`, #229 portal migration, #230 administracion
migration, #232 enforcement flip) can land independently.

## Decision

### What a view is

A view is a **NestJS provider class** with a single `execute()`
method that reads from the source context's own persistence and
returns a plain DTO. It is not a domain object, not a repository,
and not a query handler in the command/query sense — it is a
**stable public projection** of the source context's data, designed
for cross-context consumption.

```ts
@Injectable()
export class ClienteSummaryView {
  constructor(private readonly em: EntityManager) {}

  async execute(input: ClienteSummaryViewInput): Promise<ClienteSummaryDto[]> {
    // Implementation: EM find, raw SQL, or repository call —
    // internal detail, hidden from consumers.
  }
}
```

- **Class, not plain function.** Matches the existing query-handler
  convention (`ObtenerDashboardStatsHandler`, `TareaListHandler`,
  `VencimientoKpisHandler`). DI works the same way (`useFactory` with
  `EntityManager`), specs follow the same pattern, and the class name
  is a searchable symbol.
- **Single `execute(input)` method.** No batch helpers, no query
  builders, no chainable API. One call, one projection. Composition
  is the caller's responsibility.
- **No overloads.** Each distinct view is a separate class. If a
  context needs "summary for one cliente" vs "summary list across
  clientes", they are two views with two names.

### Where views live

```
src/{context}/
  application/
    views/
      cliente-summary.view.ts          ← class + input + DTO
      cliente-summary.view.spec.ts     ← mocked-EM unit test
    public-views.ts                    ← barrel: tokens + DTO types
```

- **`application/views/` per source context.** Parallel to the
  existing `application/commands/` and `application/queries/`
  folders. The module treats views as first-class providers — they
  are wired in the context's module via `useFactory` with
  `EntityManager`, same as the existing query handlers.
- **`public-views.ts` per source context.** Mirrors
  `public-events.ts`. Exports (a) the injection-token symbol, (b)
  the input type, and (c) the output DTO type. Consumers import
  from `public-views.ts` — never from `views/*.view.ts` directly.
  The barrel is the contract; the class file is the implementation.
- **Spec colocated.** `{name}.view.spec.ts` next to the view.
  Mocked-EM unit test asserts shape, tenant filter, and semantics
  (e.g., date-range boundaries for
  `vencimientosProximosView`).

### Naming

- **Class:** `ClienteSummaryView` — noun + `View` suffix.
  Chosen over `getClienteSummary` (verb form reads as a command)
  and `clienteSummaryView` (lowercase plain function — breaks from
  the existing class-with-`execute()` convention).
- **Input type:** `ClienteSummaryViewInput`. Required even when
  single-field — gives consumers a named contract to pass and
  makes future additive evolution painless.
- **DTO type:** `ClienteSummaryDto`. Consumers import this type.
  The `Dto` suffix matches `tarea-list.query.ts`'s `TareaListDto`
  and similar.
- **DI token:** `CLIENTE_SUMMARY_VIEW` — `const` symbol exported
  from `public-views.ts`. Consumers depend on the symbol, not on
  the class. This hides the implementation class from the read-
  model context.

### Tenant-scoped vs global views

Two variants, distinguished by **input shape**:

```ts
// Tenant-scoped (the common case)
export interface ClienteSummaryViewInput {
  estudioId: string; // Phase 1 — plain id
  // → principal: EstudioPrincipal after PRD #193 Phase 3 lands.
  // Additional filters as needed.
}

// Global / cross-tenant (admin only)
export interface AllEstudiosOverviewViewInput {
  // No estudioId. Explicit intent: cross-tenant read.
}
```

- **Tenant-scoped is the default.** The input type carries
  `estudioId` today. When PRD #193 Phase 3 lands (#231), the
  signature upgrades to `principal: EstudioPrincipal` — a
  mechanical, per-view migration. Until then, consumers pass
  `estudioId` extracted via `@EstudioId()` at the controller.
- **Global views are explicit and rare.** Named with a hint (e.g.,
  `AllEstudiosOverviewView`, `GlobalXxxView`), permitted only for
  administracion and internal jobs. The architecture test flags
  any tenant-scoped consumer (dashboard, portal) importing a
  global-view token — out of band.
- **Views never read ambient context.** Consistent with the
  TenantBoundary arch-test rules sketched in ADR 0002 (rules 2 and
  3): no `getTenantId()` call, no `RequestContextService.estudioId`
  read inside a view. The input parameter is the sole source of
  tenant scope.

### Composition strategy

- **Default: in-memory composition in the read-model context.** The
  dashboard query handler calls multiple views in parallel
  (`Promise.all`), stitches results into its response DTO in
  JavaScript. No SQL-level joins across context schemas.
- **Escape: a pre-aggregated view in the source context.** If
  in-memory composition is too slow for a given projection, the
  fix is to add a coarser view to the source context that returns
  exactly the slice the consumer needs. The consumer still
  composes, but against a smaller number of views.
- **Not permitted: SQL-level joins across context schemas.** The
  current dashboard handler joins `vencimiento → cliente → tipo_
obligacion → estado_vencimiento` in one query. After the
  migration, each source context owns its join; the dashboard
  composes the projections. This is the whole point of the PRD.
- **Read-model-owned tables stay with raw SQL.** Administracion
  owns `dashboard_snapshot` and admin plans; queries against
  those tables stay inline in the administracion context —
  there's no cross-context coupling to break.

### Interaction with `EstudioPrincipal` (PRD #193)

- Tenant-scoped views accept the same principal that command and
  query handlers accept. The signature is `execute(principal,
input)` **after** #211 lands; `execute(input)` with
  `input.estudioId` until then.
- The `GlobalRepository`/`TenantAwareRepository` split from ADR
  0002 extends naturally: tenant-scoped views read via
  tenant-aware repositories (or directly via EM with an explicit
  `estudio_id` filter); global views read via `GlobalRepository`
  or via EM without tenant scope, and their input type makes the
  intent explicit.
- Views **never construct a principal**. They receive one. The
  interceptor is the sole production builder.

### Interaction with mappers and BaseEntity (PRDs #194, #195)

- Views return **plain DTOs**, not domain entities, not schema
  entities. They never pass a schema row through a mapper's
  `toDomain` — the mapper is for repository code that hydrates
  the aggregate. Views extract the columns they need and build a
  DTO directly.
- The output DTO is a structural type exported from
  `public-views.ts`. No class, no methods — consumers destructure.
- The view's SQL/EM call is independent of the aggregate
  reconstitution path, so the BaseEntity helper (PRD #195) does
  not apply. Views intentionally bypass the aggregate for read
  efficiency.

### Module wiring

Each source context's module registers its views via `useFactory`
with `EntityManager`, and **exports the injection tokens** so
read-model contexts can inject them:

```ts
@Module({
  // ...existing providers...
  providers: [
    {
      provide: CLIENTE_SUMMARY_VIEW,
      useFactory: (em: EntityManager) => new ClienteSummaryView(em),
      inject: [EntityManager],
    },
  ],
  exports: [CLIENTE_SUMMARY_VIEW],
})
export class ClientesModule {}
```

Read-model module imports `ClientesModule` (already does, for the
schema-import era) and injects the view token:

```ts
@Injectable()
export class ObtenerDashboardStatsHandler {
  constructor(
    @Inject(CLIENTE_SUMMARY_VIEW) private readonly clienteSummary: ClienteSummaryView,
    // ... other views ...
  ) {}
}
```

### Architecture test (to be enforced in #232)

Two rules. Drafted here, implemented non-blocking in #222 once the
first view exists, tightened to blocking in #232.

```ts
describe('ReadModelViewContract', () => {
  it('read-model contexts must not import schema entities from other contexts', () => {
    // For every file in READ_MODEL_CONTEXTS:
    //   forbid imports of `*/infrastructure/persistence/*.schema` from
    //   another bounded context.
    // Self-schema imports (e.g., administracion importing its own
    // dashboard-snapshot schema) remain allowed.
    // Violations listed with file path + offending import.
  });

  it('public views must be exported from public-views.ts', () => {
    // For every file in src/{context}/application/views/*.view.ts:
    //   the exported view class + DTO must be re-exported from
    //   src/{context}/application/public-views.ts.
    // Prevents drive-by imports from views/ that bypass the barrel.
  });
});
```

The first rule is the inverse of the existing permissive rule
(`read-model contexts may import schema entities`) — it becomes
forbidden. The current `READ_MODEL_CONTEXTS`-relaxed exemption at
`architecture.spec.ts:19` is dropped in #232.

### Test shape

- **Per-view spec** (`{name}.view.spec.ts`) in the source context,
  mocked `EntityManager`, asserts: DTO shape, tenant filter
  applied, semantic boundaries (date ranges, estado filters),
  numeric coercion where applicable.
- **Read-model query specs** assert composition: given these
  view results (mocked via DI tokens), the dashboard returns
  this DTO. No more asserting SQL details in a dashboard spec.
- **Integration tests** (if any) can continue to hit the DB
  through the full stack — the contract change is structural,
  not behavioural.

## Consequences

- **Positive:** schema changes no longer ripple across contexts.
  A rename in `cliente.schema.ts` touches the clientes view and
  stops — the dashboard DTO is stable.
- **Positive:** each source context owns its read shape. KPI
  aggregation, date-range semantics, enum mapping all live where
  the knowledge lives.
- **Positive:** per-view unit tests catch projection regressions
  at the source context's CI step, not as an integration failure
  in a different context's test suite.
- **Positive:** the pattern mirrors `public-events.ts` — one
  obvious place to look for "what does this context expose?".
- **Positive:** long term, views become the network boundary if a
  context is extracted into a service. The in-process
  `view.execute()` call becomes an HTTP/gRPC call with the same
  contract.
- **Negative:** additional indirection for simple reads. A query
  that used to be a raw SQL `JOIN` becomes two views plus an
  in-memory stitch. Acceptable — the PRD's whole justification is
  that the coupling is the problem.
- **Negative:** cross-context composition that needs pagination
  or sorting across contexts is awkward. Out of scope for now;
  the three concrete migrations (#222-#224) do not need it.
- **Neutral:** during the phased migration, both paths coexist.
  Read-model contexts import both schemas (old) and views (new).
  The arch test stays permissive until #232.

## Non-goals

- Materialised views, read-model snapshots, CDC projections.
  Administracion's existing snapshot pattern stays as-is. Views
  are request-time; durable projections are a separate concern.
- Real-time streaming or push-based view invalidation. In-process
  only.
- Cross-service view calls (HTTP/gRPC). Views are in-process
  function calls; a future service extraction can reuse the
  contract but is not part of this PRD.
- Refactoring read-model DTO return types. Administracion and
  portal DTOs stay as they are; views feed them.
- Code generation for views. Hand-written, same as queries and
  commands.

## Reviewer decisions (2026-04-16)

- **Class + `execute()` confirmed.** Matches the existing query-
  handler convention; DI ergonomics and grepable class names win
  over plain-function simplicity.
- **`public-views.ts` barrel confirmed** alongside
  `public-events.ts`. Dedicated barrel per context, one grepable
  answer to "what does this context publish?". Consumers import
  tokens + types from the barrel; `views/*.view.ts` is private.
- **Tenant input ships with `{ estudioId: string }` today**, and is
  mechanically migrated to `EstudioPrincipal` after PRD #193 Phase
  3 (#231) lands. Lets #222–#224 proceed without blocking on #211;
  accepted cost is a one-line signature rename per view at
  enforcement-flip time.
- **In-memory composition is the default.** No SQL-level joins
  across context schemas. Escape hatch: add a coarser pre-
  aggregated view in the source context if a projection is
  measurably slow. "Supersized" cross-cutting views explicitly
  rejected — they re-introduce the coupling the PRD removes.

## Migration plan summary

| Phase | Issue | Scope                                                                                                                                                                     |
| ----- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | #222  | Tracer-bullet: `clienteSummaryView` in clientes, dashboard swaps its `ClienteEntity` schema import for the view. Non-blocking arch test rules added.                      |
| 2     | #223  | `vencimientosProximosView` in obligaciones; dashboard migrates.                                                                                                           |
| 2     | #224  | `tareasPendientesView` in tareas; dashboard migrates.                                                                                                                     |
| 2     | #229  | Portal migrates all cross-context schema imports to views (new views added to source contexts as needed).                                                                 |
| 2     | #230  | Administracion migrates cross-context schema imports to views (global variants in source contexts as needed).                                                             |
| 3     | #232  | Arch-test rules flipped to blocking: read-model contexts must not import cross-context schemas. `READ_MODEL_CONTEXTS` schema-import exemption deleted. CLAUDE.md updated. |
