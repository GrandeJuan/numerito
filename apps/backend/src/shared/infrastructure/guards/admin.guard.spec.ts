import { AdminGuard } from './admin.guard';
import { ForbiddenException, UnauthorizedException, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';

describe('AdminGuard', () => {
  let guard: AdminGuard;
  let jwtService: { verifyAsync: jest.Mock };
  let configService: { get: jest.Mock };
  let reflector: { getAllAndOverride: jest.Mock };

  const mockContext = (authHeader?: string, user?: Record<string, unknown>): ExecutionContext => {
    const request: Record<string, unknown> = {
      headers: { authorization: authHeader },
    };
    if (user) request.user = user;
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as any;
  };

  beforeEach(() => {
    jwtService = { verifyAsync: jest.fn() };
    configService = { get: jest.fn().mockReturnValue('test-secret') };
    reflector = { getAllAndOverride: jest.fn().mockReturnValue(false) };
    guard = new AdminGuard(
      jwtService as any as JwtService,
      configService as any as ConfigService,
      reflector as any as Reflector,
    );
  });

  it('should allow public routes', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    const result = await guard.canActivate(mockContext());
    expect(result).toBe(true);
  });

  it('should reject when no token (401 before role check)', async () => {
    await expect(guard.canActivate(mockContext())).rejects.toThrow(UnauthorizedException);
  });

  it('should reject when token is invalid (401 before role check)', async () => {
    jwtService.verifyAsync.mockRejectedValue(new Error('invalid'));
    await expect(guard.canActivate(mockContext('Bearer bad'))).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should allow SUPERADMIN with valid token', async () => {
    const payload = { sub: '1', email: 'admin@test.com', rol: 'SUPERADMIN' };
    jwtService.verifyAsync.mockResolvedValue(payload);

    const result = await guard.canActivate(mockContext('Bearer valid-token'));
    expect(result).toBe(true);
  });

  it('should reject SOCIO with valid token (403)', async () => {
    const payload = { sub: '2', email: 'socio@test.com', rol: 'SOCIO' };
    jwtService.verifyAsync.mockResolvedValue(payload);

    await expect(guard.canActivate(mockContext('Bearer valid-token'))).rejects.toThrow(
      ForbiddenException,
    );
    await expect(guard.canActivate(mockContext('Bearer valid-token'))).rejects.toThrow(
      'Acceso restringido a superadministradores',
    );
  });

  it('should reject EMPLEADO with valid token (403)', async () => {
    const payload = { sub: '3', email: 'emp@test.com', rol: 'EMPLEADO' };
    jwtService.verifyAsync.mockResolvedValue(payload);

    await expect(guard.canActivate(mockContext('Bearer valid-token'))).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('should reject CLIENTE with valid token (403)', async () => {
    const payload = { sub: '4', email: 'cli@test.com', rol: 'CLIENTE' };
    jwtService.verifyAsync.mockResolvedValue(payload);

    await expect(guard.canActivate(mockContext('Bearer valid-token'))).rejects.toThrow(
      ForbiddenException,
    );
  });
});
