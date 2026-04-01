import { NombreEstudio } from './nombre-estudio.vo';

describe('NombreEstudio Value Object', () => {
  it('should create a valid nombre', () => {
    const nombre = NombreEstudio.create('Grande & Asociados');
    expect(nombre.value).toBe('Grande & Asociados');
  });

  it('should trim whitespace', () => {
    const nombre = NombreEstudio.create('  Grande & Asociados  ');
    expect(nombre.value).toBe('Grande & Asociados');
  });

  it('should throw on empty nombre', () => {
    expect(() => NombreEstudio.create('')).toThrow();
    expect(() => NombreEstudio.create('   ')).toThrow();
  });

  it('should throw on nombre too short', () => {
    expect(() => NombreEstudio.create('AB')).toThrow();
  });

  it('should be equal when values match', () => {
    const n1 = NombreEstudio.create('Grande & Asociados');
    const n2 = NombreEstudio.create('Grande & Asociados');
    expect(n1.equals(n2)).toBe(true);
  });
});
