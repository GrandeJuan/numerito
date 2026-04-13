import { BaseRepository } from './base.repository';
import { TenantContext } from './tenant-context';

export abstract class TenantAwareRepository<T> implements BaseRepository<T> {
  constructor(protected readonly context: TenantContext) {}

  protected getTenantId(): string {
    const tenantId = this.context.estudioId;
    if (!tenantId) {
      throw new Error('Tenant context not available');
    }
    return tenantId;
  }

  abstract findById(id: string): Promise<T | null>;
  abstract findAll(): Promise<T[]>;
  abstract save(entity: T): Promise<void>;
  abstract delete(entity: T): Promise<void>;
}
