import { TenantContextMiddleware, TENANT_ID_HEADER } from './tenant-context.middleware';

describe('TenantContextMiddleware', () => {
  let middleware: TenantContextMiddleware;
  let next: jest.Mock;

  beforeEach(() => {
    middleware = new TenantContextMiddleware();
    next = jest.fn();
  });

  it('should set tenantId from header', () => {
    const req: any = { headers: { [TENANT_ID_HEADER]: 'tenant-abc' } };
    middleware.use(req, {} as any, next);
    expect(req.tenantId).toBe('tenant-abc');
    expect(next).toHaveBeenCalled();
  });

  it('should not set tenantId when header is absent', () => {
    const req: any = { headers: {} };
    middleware.use(req, {} as any, next);
    expect(req.tenantId).toBeUndefined();
    expect(next).toHaveBeenCalled();
  });

  it('should export TENANT_ID_HEADER as "x-tenant-id"', () => {
    expect(TENANT_ID_HEADER).toBe('x-tenant-id');
  });
});
