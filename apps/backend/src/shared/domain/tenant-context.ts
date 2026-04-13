export interface TenantContext {
  readonly estudioId?: string;
}

export const TENANT_CONTEXT = Symbol('TenantContext');
