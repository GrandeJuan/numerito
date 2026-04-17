/**
 * Typed principal representing "the estudio this request operates on".
 *
 * Produced once per request by `EstudioPrincipalInterceptor` (runs after
 * auth guards so `req.user` is populated). Threaded explicitly through
 * every command/query handler and tenant-aware repository method.
 *
 * Plain interface (not a class) so tests can construct it inline:
 *   { estudioId: 'e1', userId: 'u1', roles: [] }
 *
 * ## Phased rollout (PRD #193)
 *
 * - **Phase 1 (#211):** Land the type, interceptor, decorator, and
 *   non-blocking arch test. No call sites change yet.
 * - **Phase 2 (#225–#228):** Per-context migration — handlers and
 *   repositories switch to principal-taking signatures.
 * - **Phase 3 (#231):** Flip arch test to blocking, deprecate
 *   `@EstudioId()`, delete ambient `getTenantId()` reads outside
 *   the repository base.
 *
 * @see ADR 0002 — EstudioPrincipal value object and migration coexistence
 */
export interface EstudioPrincipal {
  /** The estudio (tenant) this request operates on. Required and non-nullable. */
  readonly estudioId: string;
  /** The authenticated user performing the action. */
  readonly userId: string;
  /** Roles carried for forward compatibility; not enforced by the principal itself. */
  readonly roles: readonly string[];
}
