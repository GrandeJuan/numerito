import { TenantContext } from './tenant-context';

/**
 * Base class for tenant-aware repositories.
 *
 * Provides {@link getTenantId} for repositories still using ambient context,
 * and serves as a marker for the architecture test (Phase 1 → Phase 3).
 *
 * Concrete repos define their own method signatures via domain-specific
 * interfaces. During Phase 2 migration (#225–#228), migrated repos accept
 * `EstudioPrincipal` as first parameter and stop calling `getTenantId()`.
 * Non-migrated repos continue using `getTenantId()` until their turn.
 *
 * Phase 3 (#231) will deprecate `getTenantId()` entirely.
 */
export abstract class TenantAwareRepository<T> {
  constructor(protected readonly context: TenantContext) {}

  protected getTenantId(): string {
    const tenantId = this.context.estudioId;
    if (!tenantId) {
      throw new Error('Tenant context not available');
    }
    return tenantId;
  }
}
