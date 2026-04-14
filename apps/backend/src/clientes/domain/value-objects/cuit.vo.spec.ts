import { Cuit } from './cuit.vo';
import { validarCuit } from '@numerito/shared';

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

describe('Cuit VO and shared validarCuit agreement', () => {
  const cases = [
    { input: '20-12345678-6', valid: true },
    { input: '20123456786', valid: true },
    { input: '20-12345678-0', valid: false },
    { input: '27-28472123-0', valid: false },
    { input: '123', valid: false },
    { input: '', valid: false },
    { input: 'abcdefghijk', valid: false },
  ];

  it.each(cases)('should agree on "$input" (valid=$valid)', ({ input, valid }) => {
    const voAccepts = (() => { try { Cuit.create(input); return true; } catch { return false; } })();
    const sharedAccepts = validarCuit(input.replace(/-/g, ''));
    expect(voAccepts).toBe(valid);
    expect(sharedAccepts).toBe(valid);
  });
});
