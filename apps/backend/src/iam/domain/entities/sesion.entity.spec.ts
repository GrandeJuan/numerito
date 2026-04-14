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

  it('should expose expiresAt getter', () => {
    const expiresAt = new Date(Date.now() + 7 * 24 * 3600000);
    const sesion = Sesion.create({
      usuarioId: 'user-1',
      refreshToken: 'token-abc',
      ipAddress: '192.168.1.1',
      userAgent: 'Chrome/120',
      expiresAt,
    });
    expect(sesion.expiresAt).toBe(expiresAt);
  });

  it('should validate active non-expired session via isValid', () => {
    const sesion = Sesion.create({
      usuarioId: 'user-1',
      refreshToken: 'token-abc',
      ipAddress: '192.168.1.1',
      userAgent: 'Chrome/120',
      expiresAt: new Date(Date.now() + 7 * 24 * 3600000),
    });
    expect(sesion.isValid).toBe(true);
  });

  it('should be invalid when revoked', () => {
    const sesion = Sesion.create({
      usuarioId: 'user-1',
      refreshToken: 'token-abc',
      ipAddress: '192.168.1.1',
      userAgent: 'Chrome/120',
      expiresAt: new Date(Date.now() + 7 * 24 * 3600000),
    });
    sesion.revoke();
    expect(sesion.isValid).toBe(false);
  });

  it('should be invalid when expired', () => {
    const sesion = Sesion.create({
      usuarioId: 'user-1',
      refreshToken: 'token-abc',
      ipAddress: '192.168.1.1',
      userAgent: 'Chrome/120',
      expiresAt: new Date(Date.now() - 1000),
    });
    expect(sesion.isValid).toBe(false);
  });

  describe('reconstitute', () => {
    it('should reconstitute preserving all fields including inactive state', () => {
      const expiresAt = new Date('2027-01-01');
      const sesion = Sesion.reconstitute({
        usuarioId: 'user-1',
        refreshToken: 'token-xyz',
        ipAddress: '10.0.0.1',
        userAgent: 'Firefox/130',
        expiresAt,
        isActive: false,
      }, 'existing-id');

      expect(sesion.id).toBe('existing-id');
      expect(sesion.usuarioId).toBe('user-1');
      expect(sesion.refreshToken).toBe('token-xyz');
      expect(sesion.ipAddress).toBe('10.0.0.1');
      expect(sesion.userAgent).toBe('Firefox/130');
      expect(sesion.expiresAt).toBe(expiresAt);
      expect(sesion.isActive).toBe(false);
    });

    it('should not emit domain events on reconstitution', () => {
      const sesion = Sesion.reconstitute({
        usuarioId: 'user-1',
        refreshToken: 'token-abc',
        ipAddress: '192.168.1.1',
        userAgent: 'Chrome/120',
        expiresAt: new Date(Date.now() + 7 * 24 * 3600000),
        isActive: true,
      }, 'some-id');

      expect(sesion.getDomainEvents()).toHaveLength(0);
    });

    it('should allow domain operations on reconstituted entities', () => {
      const sesion = Sesion.reconstitute({
        usuarioId: 'user-1',
        refreshToken: 'token-abc',
        ipAddress: '192.168.1.1',
        userAgent: 'Chrome/120',
        expiresAt: new Date(Date.now() + 7 * 24 * 3600000),
        isActive: true,
      }, 'some-id');

      sesion.revoke();
      expect(sesion.isActive).toBe(false);
    });
  });
});
