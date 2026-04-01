import { JwtTokenService } from './jwt-token.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

describe('JwtTokenService', () => {
  let service: JwtTokenService;
  let jwtService: { sign: jest.Mock; verify: jest.Mock };
  let configService: { get: jest.Mock };

  const payload = { sub: 'user-1', email: 'a@b.com', rol: 'SOCIO' };

  beforeEach(() => {
    jwtService = {
      sign: jest.fn().mockReturnValue('signed-token'),
      verify: jest.fn().mockReturnValue(payload),
    };
    configService = {
      get: jest.fn().mockImplementation((key: string, defaultVal?: string) => {
        const map: Record<string, string> = {
          JWT_SECRET: 'secret',
          JWT_EXPIRATION: '15m',
          JWT_REFRESH_EXPIRATION: '7d',
        };
        return map[key] ?? defaultVal;
      }),
    };
    service = new JwtTokenService(
      jwtService as any as JwtService,
      configService as any as ConfigService,
    );
  });

  it('should generate access token', () => {
    const token = service.generateAccessToken(payload);
    expect(token).toBe('signed-token');
    expect(jwtService.sign).toHaveBeenCalledWith(payload, {
      secret: 'secret',
      expiresIn: '15m',
    });
  });

  it('should generate refresh token', () => {
    const token = service.generateRefreshToken(payload);
    expect(token).toBe('signed-token');
    expect(jwtService.sign).toHaveBeenCalledWith(payload, {
      secret: 'secret',
      expiresIn: '7d',
    });
  });

  it('should verify refresh token', () => {
    const result = service.verifyRefreshToken('some-token');
    expect(result).toEqual(payload);
    expect(jwtService.verify).toHaveBeenCalledWith('some-token', { secret: 'secret' });
  });
});
