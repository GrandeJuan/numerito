import { crearClienteSchema } from './cliente.schema';

describe('crearClienteSchema', () => {
  const valid = {
    cuit: '20-12345678-6',
    razonSocial: 'Acme SA',
    condicionIva: 'RESPONSABLE_INSCRIPTO',
    tipo: 'PERSONA_JURIDICA',
    regimen: 'GENERAL',
  };

  it('accepts valid cliente input', () => {
    const result = crearClienteSchema.parse(valid);
    expect(result.razonSocial).toBe('Acme SA');
  });

  it('rejects razonSocial shorter than 3 characters', () => {
    expect(() => crearClienteSchema.parse({ ...valid, razonSocial: 'AB' })).toThrow();
  });

  it('rejects empty cuit', () => {
    expect(() => crearClienteSchema.parse({ ...valid, cuit: '' })).toThrow();
  });

  it('rejects cuit with wrong check digit', () => {
    expect(() => crearClienteSchema.parse({ ...valid, cuit: '20-12345678-0' })).toThrow();
  });

  it('rejects cuit with invalid format', () => {
    expect(() => crearClienteSchema.parse({ ...valid, cuit: '123' })).toThrow();
  });

  it('accepts cuit without dashes', () => {
    const result = crearClienteSchema.parse({ ...valid, cuit: '20123456786' });
    expect(result.cuit).toBe('20123456786');
  });
});
