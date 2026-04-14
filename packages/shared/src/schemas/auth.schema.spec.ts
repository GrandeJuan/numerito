import { iniciarSesionSchema, registrarUsuarioSchema } from './auth.schema';

describe('iniciarSesionSchema', () => {
  it('accepts valid login input', () => {
    const result = iniciarSesionSchema.parse({ email: 'test@example.com', password: 'secret' });
    expect(result.email).toBe('test@example.com');
  });

  it('rejects invalid email', () => {
    expect(() => iniciarSesionSchema.parse({ email: 'not-email', password: 'secret' })).toThrow();
  });

  it('rejects empty password', () => {
    expect(() => iniciarSesionSchema.parse({ email: 'test@example.com', password: '' })).toThrow();
  });
});

describe('registrarUsuarioSchema', () => {
  const valid = {
    email: 'user@example.com',
    password: '12345678',
    nombre: 'Juan',
    apellido: 'Perez',
    rol: 'SOCIO',
  };

  it('accepts valid registration input', () => {
    const result = registrarUsuarioSchema.parse(valid);
    expect(result.nombre).toBe('Juan');
  });

  it('rejects password shorter than 8 characters', () => {
    expect(() => registrarUsuarioSchema.parse({ ...valid, password: '1234567' })).toThrow();
  });

  it('rejects missing nombre', () => {
    const { nombre, ...rest } = valid;
    expect(() => registrarUsuarioSchema.parse(rest)).toThrow();
  });
});
