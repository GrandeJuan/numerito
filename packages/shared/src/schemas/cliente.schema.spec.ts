import { crearClienteSchema } from './cliente.schema';

describe('crearClienteSchema', () => {
  const valid = {
    cuit: '20-12345678-9',
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
});
