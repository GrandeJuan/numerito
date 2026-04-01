import { Sesion } from './sesion.entity';

describe('Sesion Entity', () => {
  it('should create a session with device info', () => {
    const sesion = Sesion.create({
      usuarioId: 'user-1',
      refreshToken: 'token-abc',
      ipAddress: '192.168.1.1',
      userAgent: 'Chrome/120',
      expiresAt: new Date(Date.now() + 7 * 24 * 3600000),
    });

    expect(sesion.id).toBeDefined();
    expect(sesion.usuarioId).toBe('user-1');
    expect(sesion.refreshToken).toBe('token-abc');
    expect(sesion.ipAddress).toBe('192.168.1.1');
    expect(sesion.userAgent).toBe('Chrome/120');
    expect(sesion.isActive).toBe(true);
  });

  it('should revoke a session (remote logout)', () => {
    const sesion = Sesion.create({
      usuarioId: 'user-1',
      refreshToken: 'token-abc',
      ipAddress: '192.168.1.1',
      userAgent: 'Chrome/120',
      expiresAt: new Date(Date.now() + 7 * 24 * 3600000),
    });

    sesion.revoke();
    expect(sesion.isActive).toBe(false);
  });

  it('should detect expired session', () => {
    const sesion = Sesion.create({
      usuarioId: 'user-1',
      refreshToken: 'token-abc',
      ipAddress: '192.168.1.1',
      userAgent: 'Chrome/120',
      expiresAt: new Date(Date.now() - 1000),
    });

    expect(sesion.isExpired).toBe(true);
  });
});
