import { TenantRequiredGuard } from './tenant-required.guard';
import { BadRequestException, ExecutionContext } from '@nestjs/common';

describe('TenantRequiredGuard', () => {
  let guard: TenantRequiredGuard;

  const mockContext = (tenantId?: string): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ tenantId }),
      }),
    }) as any;

  beforeEach(() => {
    guard = new TenantRequiredGuard();
  });

  it('should allow when tenantId is present', () => {
    expect(guard.canActivate(mockContext('tenant-123'))).toBe(true);
  });

  it('should throw BadRequestException when tenantId is missing', () => {
    expect(() => guard.canActivate(mockContext())).toThrow(BadRequestException);
    expect(() => guard.canActivate(mockContext())).toThrow(
      'Header x-tenant-id es requerido',
    );
  });

  it('should throw when tenantId is empty string (falsy)', () => {
    expect(() => guard.canActivate(mockContext(''))).toThrow(BadRequestException);
  });
});
