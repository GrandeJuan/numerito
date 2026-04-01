import { JwtAuthGuard } from './jwt-auth.guard';
import { UnauthorizedException, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtService: { verifyAsync: jest.Mock };
  let configService: { get: jest.Mock };
  let reflector: { getAllAndOverride: jest.Mock };

  const mockContext = (authHeader?: string): ExecutionContext =>
    ({
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({
          headers: { authorization: authHeader },
          user: undefined,
        }),
      }),
    }) as any;

  beforeEach(() => {
    jwtService = { verifyAsync: jest.fn() };
    configService = { get: jest.fn().mockReturnValue('test-secret') };
    reflector = { getAllAndOverride: jest.fn().mockReturnValue(false) };
    guard = new JwtAuthGuard(
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

  it('should reject when no token', async () => {
    await expect(guard.canActivate(mockContext())).rejects.toThrow(UnauthorizedException);
    await expect(guard.canActivate(mockContext())).rejects.toThrow('Token no proporcionado');
  });

  it('should reject when no Bearer prefix', async () => {
    await expect(guard.canActivate(mockContext('Basic abc'))).rejects.toThrow(
      'Token no proporcionado',
    );
  });

  it('should reject when invalid token', async () => {
    jwtService.verifyAsync.mockRejectedValue(new Error('invalid'));
    await expect(guard.canActivate(mockContext('Bearer bad-token'))).rejects.toThrow(
      'Token inválido o expirado',
    );
  });

  it('should set request.user on valid token', async () => {
    const payload = { sub: '1', email: 'a@b.com', rol: 'SOCIO' };
    jwtService.verifyAsync.mockResolvedValue(payload);

    const request: any = { headers: { authorization: 'Bearer valid-token' } };
    const ctx = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({ getRequest: () => request }),
    } as any as ExecutionContext;

    const result = await guard.canActivate(ctx);
    expect(result).toBe(true);
    expect(request.user).toEqual(payload);
    expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-token', { secret: 'test-secret' });
  });
});
