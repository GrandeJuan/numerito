import { Cuit } from './cuit.vo';

describe('Cuit Value Object', () => {
  it('should create a valid CUIT with dashes', () => {
    const cuit = Cuit.create('20-12345678-6');
    expect(cuit.value).toBe('20-12345678-6');
    expect(cuit.raw).toBe('20123456786');
  });

  it('should create a valid CUIT without dashes', () => {
    const cuit = Cuit.create('20123456786');
    expect(cuit.value).toBe('20-12345678-6');
  });

  it('should throw on invalid check digit', () => {
    expect(() => Cuit.create('20-12345678-0')).toThrow();
  });

  it('should throw on invalid format', () => {
    expect(() => Cuit.create('123')).toThrow();
    expect(() => Cuit.create('')).toThrow();
    expect(() => Cuit.create('abcdefghijk')).toThrow();
  });

  it('should be equal when values match', () => {
    const c1 = Cuit.create('20-12345678-6');
    const c2 = Cuit.create('20123456786');
    expect(c1.equals(c2)).toBe(true);
  });
});
