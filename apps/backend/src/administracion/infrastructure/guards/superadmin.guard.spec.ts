import { ForbiddenException } from '@nestjs/common';
import { SuperAdminGuard } from './superadmin.guard';

describe('SuperAdminGuard', () => {
  let guard: SuperAdminGuard;

  beforeEach(() => {
    guard = new SuperAdminGuard();
  });

  const makeContext = (user?: { rol: string }) => ({
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  });

  it('should allow SUPERADMIN role', () => {
    const context = makeContext({ rol: 'SUPERADMIN' });
    expect(guard.canActivate(context as any)).toBe(true);
  });

  it('should reject SOCIO role', () => {
    const context = makeContext({ rol: 'SOCIO' });
    expect(() => guard.canActivate(context as any)).toThrow(ForbiddenException);
  });

  it('should reject when no user', () => {
    const context = makeContext(undefined);
    expect(() => guard.canActivate(context as any)).toThrow(ForbiddenException);
  });

  it('should reject EMPLEADO role', () => {
    const context = makeContext({ rol: 'EMPLEADO' });
    expect(() => guard.canActivate(context as any)).toThrow(ForbiddenException);
  });
});
