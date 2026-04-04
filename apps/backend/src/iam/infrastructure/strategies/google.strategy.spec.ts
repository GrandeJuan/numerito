import { GoogleStrategy } from './google.strategy';
import { ConfigService } from '@nestjs/config';

describe('GoogleStrategy', () => {
  let strategy: GoogleStrategy;

  beforeEach(() => {
    const configService = {
      get: jest.fn((key: string, fallback: string) => {
        if (key === 'GOOGLE_CLIENT_ID') return 'test-client-id';
        if (key === 'GOOGLE_CLIENT_SECRET') return 'test-secret';
        return fallback;
      }),
    } as unknown as ConfigService;
    strategy = new GoogleStrategy(configService);
  });

  it('should extract user data from Google profile', () => {
    const done = jest.fn();
    const profile = {
      id: 'google-abc-123',
      emails: [{ value: 'maria@gmail.com' }],
      name: { givenName: 'Maria', familyName: 'Garcia' },
    };

    strategy.validate('access', 'refresh', profile, done);

    expect(done).toHaveBeenCalledWith(null, {
      provider: 'google',
      providerId: 'google-abc-123',
      email: 'maria@gmail.com',
      nombre: 'Maria',
      apellido: 'Garcia',
    });
  });

  it('should handle missing name fields gracefully', () => {
    const done = jest.fn();
    const profile = {
      id: 'google-456',
      emails: [{ value: 'test@gmail.com' }],
      name: {},
    };

    strategy.validate('access', 'refresh', profile, done);

    expect(done).toHaveBeenCalledWith(null, {
      provider: 'google',
      providerId: 'google-456',
      email: 'test@gmail.com',
      nombre: '',
      apellido: '',
    });
  });

  it('should handle missing emails gracefully', () => {
    const done = jest.fn();
    const profile = {
      id: 'google-789',
      name: { givenName: 'Test' },
    };

    strategy.validate('access', 'refresh', profile, done);

    expect(done).toHaveBeenCalledWith(null, expect.objectContaining({
      email: '',
    }));
  });
});
