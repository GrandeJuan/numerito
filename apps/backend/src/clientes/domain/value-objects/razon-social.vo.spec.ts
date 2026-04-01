import { RazonSocial } from './razon-social.vo';

describe('RazonSocial Value Object', () => {
  it('should create a valid razon social', () => {
    const rs = RazonSocial.create('Grande & Asociados S.A.');
    expect(rs.value).toBe('Grande & Asociados S.A.');
  });

  it('should trim whitespace', () => {
    const rs = RazonSocial.create('  Grande S.A.  ');
    expect(rs.value).toBe('Grande S.A.');
  });

  it('should throw on empty', () => {
    expect(() => RazonSocial.create('')).toThrow();
    expect(() => RazonSocial.create('  ')).toThrow();
  });

  it('should throw on too short', () => {
    expect(() => RazonSocial.create('AB')).toThrow();
  });
});
