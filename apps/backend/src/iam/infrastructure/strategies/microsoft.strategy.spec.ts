import { MicrosoftStrategy } from './microsoft.strategy';
import { ConfigService } from '@nestjs/config';

describe('MicrosoftStrategy', () => {
  let strategy: MicrosoftStrategy;

  beforeEach(() => {
    const configService = {
      get: jest.fn((key: string, fallback: string) => {
        if (key === 'MICROSOFT_CLIENT_ID') return 'test-client-id';
        if (key === 'MICROSOFT_CLIENT_SECRET') return 'test-secret';
        return fallback;
      }),
    } as unknown as ConfigService;
    strategy = new MicrosoftStrategy(configService);
  });

  it('should extract user data from Microsoft profile', () => {
    const done = jest.fn();
    const profile = {
      id: 'ms-abc-123',
      emails: [{ value: 'carlos@outlook.com' }],
      name: { givenName: 'Carlos', familyName: 'Lopez' },
      displayName: 'Carlos Lopez',
    };

    strategy.validate('access', 'refresh', profile, done);

    expect(done).toHaveBeenCalledWith(null, {
      provider: 'microsoft',
      providerId: 'ms-abc-123',
      email: 'carlos@outlook.com',
      nombre: 'Carlos',
      apellido: 'Lopez',
    });
  });

  it('should fallback to displayName when givenName is missing', () => {
    const done = jest.fn();
    const profile = {
      id: 'ms-456',
      emails: [{ value: 'test@outlook.com' }],
      name: {},
      displayName: 'Display Name',
    };

    strategy.validate('access', 'refresh', profile, done);

    expect(done).toHaveBeenCalledWith(null, expect.objectContaining({
      nombre: 'Display Name',
      apellido: '',
    }));
  });

  it('should handle missing emails gracefully', () => {
    const done = jest.fn();
    const profile = {
      id: 'ms-789',
      name: { givenName: 'Test', familyName: 'User' },
    };

    strategy.validate('access', 'refresh', profile, done);

    expect(done).toHaveBeenCalledWith(null, expect.objectContaining({
      email: '',
    }));
  });
});
