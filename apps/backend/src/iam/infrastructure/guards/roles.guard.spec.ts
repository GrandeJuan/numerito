import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ROL } from '@numerito/shared';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  const mockContext = (rol?: string): ExecutionContext =>
    ({
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user: rol ? { rol } : {} }),
      }),
    }) as any;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('should allow access when no roles required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    expect(guard.canActivate(mockContext(ROL.SOCIO))).toBe(true);
  });

  it('should allow SOCIO when SOCIO is required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([ROL.SOCIO]);
    expect(guard.canActivate(mockContext(ROL.SOCIO))).toBe(true);
  });

  it('should deny CLIENTE when SOCIO is required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([ROL.SOCIO]);
    expect(() => guard.canActivate(mockContext(ROL.CLIENTE))).toThrow(ForbiddenException);
  });

  it('should allow when user has one of multiple required roles', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([ROL.SOCIO, ROL.RESPONSABLE]);
    expect(guard.canActivate(mockContext(ROL.RESPONSABLE))).toBe(true);
  });

  it('should allow when required roles is empty array', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([]);
    expect(guard.canActivate(mockContext(ROL.SOCIO))).toBe(true);
  });

  it('should throw when user has no rol', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([ROL.SOCIO]);
    const ctx = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user: {} }),
      }),
    } as any;
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(ctx)).toThrow('Rol no encontrado en el token');
  });

  it('should throw when user is undefined', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([ROL.SOCIO]);
    const ctx = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({}),
      }),
    } as any;
    expect(() => guard.canActivate(ctx)).toThrow('Rol no encontrado en el token');
  });
});
