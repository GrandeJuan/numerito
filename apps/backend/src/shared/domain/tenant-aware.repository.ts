import { TenantContext } from './tenant-context';

/**
 * Base class for tenant-aware repositories.
 *
 * Serves as a marker for the architecture test: every public method on a
 * repository extending this class must accept `EstudioPrincipal` as its
 * first parameter. The architecture test enforces this as a blocking
 * assertion (Phase 3, #231).
 *
 * Concrete repos define their own method signatures via domain-specific
 * interfaces. All bounded-context repos have been migrated to accept
 * `EstudioPrincipal` explicitly (#225–#228).
 */
export abstract class TenantAwareRepository<_T> {
  constructor(protected readonly context: TenantContext) {}

  /**
   * @deprecated Use `EstudioPrincipal` parameter on each repository method instead.
   *
   * Legacy ambient tenant-id reader. Retained only for non-bounded-context
   * repositories (e.g., notificaciones) that have not yet migrated.
   * All bounded-context repositories now receive the tenant via
   * `EstudioPrincipal` as first parameter — do not use this in new code.
   *
   * Will be removed once all repositories are migrated.
   */
  protected getTenantId(): string {
    const tenantId = this.context.estudioId;
    if (!tenantId) {
      throw new Error('Tenant context not available');
    }
    return tenantId;
  }
}
