import { EstudioMemberGuard } from './estudio-member.guard';
import { BadRequestException, UnauthorizedException, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';

describe('EstudioMemberGuard', () => {
  let guard: EstudioMemberGuard;
  let jwtService: { verifyAsync: jest.Mock };
  let configService: { get: jest.Mock };
  let reflector: { getAllAndOverride: jest.Mock };

  const mockContext = (options?: {
    authHeader?: string;
    estudioId?: string;
  }): ExecutionContext => {
    const request: Record<string, unknown> = {
      headers: { authorization: options?.authHeader },
      estudioId: options?.estudioId,
    };
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
    guard = new EstudioMemberGuard(
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

  it('should reject when no token (401)', async () => {
    await expect(guard.canActivate(mockContext())).rejects.toThrow(UnauthorizedException);
  });

  it('should reject when token is invalid (401)', async () => {
    jwtService.verifyAsync.mockRejectedValue(new Error('invalid'));
    await expect(
      guard.canActivate(mockContext({ authHeader: 'Bearer bad' })),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should reject when authenticated but no estudioId header', async () => {
    const payload = { sub: '1', email: 'user@test.com', rol: 'SOCIO' };
    jwtService.verifyAsync.mockResolvedValue(payload);

    await expect(
      guard.canActivate(mockContext({ authHeader: 'Bearer valid-token' })),
    ).rejects.toThrow(BadRequestException);
    await expect(
      guard.canActivate(mockContext({ authHeader: 'Bearer valid-token' })),
    ).rejects.toThrow('Header x-estudio-id es requerido');
  });

  it('should allow when authenticated with estudioId header', async () => {
    const payload = { sub: '1', email: 'user@test.com', rol: 'SOCIO' };
    jwtService.verifyAsync.mockResolvedValue(payload);

    const result = await guard.canActivate(
      mockContext({ authHeader: 'Bearer valid-token', estudioId: 'est-123' }),
    );
    expect(result).toBe(true);
  });

  it('should reject when estudioId is empty string', async () => {
    const payload = { sub: '1', email: 'user@test.com', rol: 'SOCIO' };
    jwtService.verifyAsync.mockResolvedValue(payload);

    await expect(
      guard.canActivate(mockContext({ authHeader: 'Bearer valid-token', estudioId: '' })),
    ).rejects.toThrow(BadRequestException);
  });
});
