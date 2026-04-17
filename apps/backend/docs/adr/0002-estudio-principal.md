# ADR 0002 — EstudioPrincipal value object and migration coexistence

**Status:** Accepted
**Date:** 2026-04-16
**Issue:** #205 (PRD #193)
**Approved by:** Federico Rossi (2026-04-16)

## Context

Multi-tenancy enforcement is currently spread across four points:

- `RequestContextMiddleware` reads the `x-estudio-id` header and stores
  `estudioId` on the request-scoped `RequestContextService` plus
  `req.estudioId`.
- The `@EstudioId()` param decorator pulls `estudioId` from the request
  inside controllers.
- `TenantAwareRepository` calls `this.getTenantId()` against the
  request-scoped service to filter queries.
- Command and query handlers thread `estudioId` manually into their
  inputs — inconsistently: some endpoints pass it explicitly, others
  rely on ambient context.

The correctness of tenant scoping therefore depends on convention: a
new repository finder that forgets `getTenantId()` silently leaks
cross-tenant rows, and there is no compile-time nor architecture-test
guarantee. PRD #193 lifts this from convention to structural invariant
by introducing a typed principal threaded explicitly through every
command/query/repository call on a tenant-aware path.

This ADR pins down the principal's shape, ownership, and lifetime so
that subsequent slices (#211 for the port, #225–#228 for per-context
migration, #231 for the enforcement flip) can land independently.

## Decision

### Naming

The value object is **`EstudioPrincipal`**.

- Chosen over `TenantContext`: the codebase already uses
  `TenantContext` as the ambient-service interface
  (`shared/domain/tenant-context.ts`); reusing the name would collide
  during the migration window. `EstudioPrincipal` is disjoint and
  unambiguous.
- Chosen over `EstudioScope`: "principal" is the standard security
  vocabulary for "the identity under which an operation runs", and it
  admits future carriers (user id, roles) without renaming. "Scope"
  reads as a filter, which is what the principal produces, not what it
  is.

### Shape

```ts
export interface EstudioPrincipal {
  readonly estudioId: string;
  readonly userId: string;
  readonly roles: readonly string[];
}
```

- **`estudioId` is required and non-nullable.** The whole point of the
  type is to make it impossible to reach a tenant-aware repository
  without one. Endpoints that legitimately operate cross-tenant (admin
  dashboards, system jobs) receive nothing — they route through
  `GlobalRepository` instead.
- **`userId` is required.** Every tenant-aware action is performed by
  an authenticated user. Carrying `userId` on the principal lets
  handlers and repositories audit, authorise, and stamp
  `createdBy`/`updatedBy` without pulling a second decorator. It also
  unifies with the existing `@CurrentUser()` path.
- **`roles` is carried but not validated by the principal itself.**
  Authorisation rules (RBAC, permissions) remain the responsibility of
  the IAM guards and decorators. The principal is a _carrier_, not a
  policy engine. Downstream guards read `principal.roles`; the
  principal does not enforce.
- **Opaque to construction outside the interceptor in production;
  constructible directly in tests.** The shape is a plain interface
  (not a branded type, not a class with a private constructor) — so
  tests can write `{ estudioId: 'e1', userId: 'u1', roles: ['ADMIN'] }`
  inline without a factory. The production builder lives in the
  interceptor. A structural type is sufficient; we are not defending
  against malicious handler code, we are defending against forgetful
  handler code.

No permissions, no entitlements, no subscription status on the
principal. Those are queried when needed. The principal stays small.

### Construction

**Synchronous, from the authenticated request, once per request.**

```ts
@Injectable()
export class EstudioPrincipalInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = ctx.switchToHttp().getRequest();
    const estudioId = req.headers[ESTUDIO_ID_HEADER];
    const user = req.user;
    if (estudioId && user?.id) {
      req.estudioPrincipal = {
        estudioId,
        userId: user.id,
        roles: user.roles ?? [],
      };
    }
    return next.handle();
  }
}
```

- **Sync, not async.** The interceptor reads data already populated by
  the JWT guard + `RequestContextMiddleware`. No extra round-trip to
  the database. If the estudio was revoked mid-session, the next
  request's auth check catches it; the principal is not the place to
  re-validate.
- **Attached to the request, not to a new scoped service.** The
  existing request-scoped `RequestContextService` carries the same
  data and will be kept for the legacy `@EstudioId()` decorator during
  the migration window. The new principal lives on `req.estudioPrincipal`
  and is picked up by a new `@EstudioPrincipal()` param decorator.
- **Interceptor, not middleware.** Middleware runs before
  Nest's DI container is ready for some request-scoped interactions;
  the interceptor runs after guards, so we can trust `req.user` is
  populated. Mirrors Nest community best practice.

### Coexistence with `@EstudioId()` and `@CurrentUser()`

- During Phase 2 (per-context migration, #225–#228) **both paths work
  in parallel**. A handler can receive either a raw `estudioId: string`
  (old) or an `EstudioPrincipal` (new). Repositories gain
  principal-accepting overloads; the legacy ambient-context path stays
  operational.
- The `@EstudioId()` decorator is **not deleted in Phase 1**. It is
  marked `@deprecated` in Phase 3 (#231) with a migration window, then
  removed when the last caller has migrated.
- The `@CurrentUser()` decorator is **orthogonal** and stays. It
  exposes the full user projection (email, name, etc.) that the
  principal deliberately excludes. Where a handler needs only user
  identity, it takes the principal; where it needs user profile
  fields, it takes both.
- **New code, from the moment the interceptor lands, uses the
  principal.** The migration plan is "stop adding to the old pattern;
  migrate existing call sites per context".

### Domain events

- **Events carry `estudioId` and `userId` in their payloads.** They do
  not carry the full principal — the principal is a request-time
  value object and does not serialise beyond the process. Carrying
  scalar ids is sufficient and matches the existing `public-events.ts`
  convention.
- **The event bus does not enforce tenant scope.** The listener
  (`DashboardStatsListener`) is a read-model consumer that already
  aggregates across tenants; applying a principal filter there would
  be wrong. Listeners that are tenant-scoped (none today) would read
  `payload.estudioId` and filter at their own boundary.
- The principal has **no coupling to the event bus**. Publishers read
  the principal (or the aggregate's own `estudioId`) at publish time;
  subscribers never see it.

### Repository contract

Tenant-aware repositories receive the principal **explicitly** on
every public method:

```ts
interface ClienteRepository {
  findById(principal: EstudioPrincipal, id: string): Promise<Cliente | null>;
  findAll(principal: EstudioPrincipal, filters?: ClienteFilters): Promise<Cliente[]>;
  save(principal: EstudioPrincipal, entity: Cliente): Promise<void>;
  delete(principal: EstudioPrincipal, entity: Cliente): Promise<void>;
}
```

- The base class (`TenantAwareRepository`) takes the principal as its
  first argument, applies the `where: { estudio: { id:
principal.estudioId } }` filter on every query, and verifies on
  `save()` that the aggregate's `estudioId` matches
  `principal.estudioId`. Mismatch throws — defence in depth.
- `GlobalRepository` (already exists) remains the escape hatch for
  genuinely cross-tenant operations. The architecture test allows
  principal-less methods **only** on classes extending
  `GlobalRepository`.
- During the migration window the old ambient `getTenantId()` path is
  deprecated but retained. Each per-context migration slice swaps all
  call sites in that context to the principal-taking overloads; the
  ambient-reading constructor argument is removed last, per context.

### Architecture test (to be enforced in Phase 3, #231)

Draft shape (non-blocking in #211; blocking in #231):

```ts
describe('TenantBoundary', () => {
  it('tenant-aware repositories must take EstudioPrincipal as the first parameter', () => {
    // For every class extending TenantAwareRepository:
    //   every public method must have (principal: EstudioPrincipal, ...) as its signature.
    // Classes extending GlobalRepository are exempt.
    // Violations listed with file path + method name.
  });

  it('application-layer code must not call getTenantId() directly', () => {
    // grep application/**/*.ts for `getTenantId(` — zero matches expected.
    // Only the repository base and the interceptor are permitted to read ambient context.
  });

  it('application-layer code must not read RequestContextService.estudioId directly', () => {
    // grep application/**/*.ts for `.estudioId` against a RequestContextService reference.
    // Handlers that need the id receive it via EstudioPrincipal instead.
  });
});
```

### Test shape

- Handler unit specs pass a plain principal object:
  `handler.execute(cmd, { estudioId: 'e1', userId: 'u1', roles: [] })`.
  No more mocking the request-scoped service.
- Repository base specs construct a fake principal and assert the
  `where` clause and the save-time ownership check.
- Interceptor spec covers: principal built when both headers + user
  present, skipped when either is missing, carried on `req` for
  downstream reads.

## Consequences

- **Positive:** tenant scoping becomes a type-checked invariant.
  Handler tests simplify (principal is a plain object). Security
  reviews grep for one symbol (`EstudioPrincipal`) to find every
  tenant-aware boundary. The save-time ownership check is defence in
  depth against cross-principal loads.
- **Positive:** `userId` on the principal eliminates the second
  decorator call in most handlers.
- **Negative:** every repository method signature gains a leading
  parameter. Worth it — the parameter _is_ the contract.
- **Negative:** migration touches every context. Phased rollout
  (#211 port, #225–#228 per context, #231 enforcement flip) keeps
  each slice small and CI green throughout.
- **Neutral:** the principal carries `roles` for forward
  compatibility; current guards still consume them via
  `@CurrentUser()`. A later refactor can pull guards onto the
  principal without touching handler code.

## Non-goals

- Database-level multi-tenancy (row-level security, schema-per-tenant).
- Authorisation policy on the principal itself (roles carried, not
  enforced).
- Cross-service principal propagation (HTTP, gRPC headers). In-process
  only.
- Replacing `@CurrentUser()` for endpoints that need the full user
  profile.

## Reviewer decisions (2026-04-16)

- **`roles: readonly string[]` carried on the principal.** Forward
  compatibility is worth the one extra field; guards can migrate to
  read from the principal later without reshaping handler signatures.
- **`@EstudioId()` deprecated (not hard-removed) in Phase 3 (#231).**
  Lower risk of surprise build breakages; the decorator is deleted in
  a follow-up once the last caller has migrated.
- **Construction via interceptor, not middleware.** Confirmed: runs
  after auth guards so `req.user` is reliably populated.

## Migration plan summary

| Phase | Issue | Scope                                                                                                                                                |
| ----- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | #211  | Land `EstudioPrincipal` type, interceptor, `@EstudioPrincipal()` decorator, repository-base overloads, non-blocking arch test. No call sites change. |
| 2     | #225  | clientes + obligaciones migrate.                                                                                                                     |
| 2     | #226  | tareas + contabilidad migrate.                                                                                                                       |
| 2     | #227  | nomina + documentos + facturacion migrate.                                                                                                           |
| 2     | #228  | integraciones + iam + estudio migrate (GlobalRepository escape hatch documented where needed).                                                       |
| 3     | #231  | Flip arch test to blocking; deprecate `@EstudioId()`; delete ambient `getTenantId()` reads outside the repository base; update CLAUDE.md.            |
