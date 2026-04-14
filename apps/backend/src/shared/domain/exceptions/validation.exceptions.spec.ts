import {
  InvalidCuitError,
  InvalidEmailError,
  InvalidPasswordError,
  InvalidRazonSocialError,
  InvalidNombreEstudioError,
} from './validation.exceptions';
import { DomainException } from './domain.exception';

describe('Validation Exceptions', () => {
  it('InvalidCuitError should include the CUIT in the message', () => {
    const err = new InvalidCuitError('99-99999999-9');
    expect(err).toBeInstanceOf(DomainException);
    expect(err.code).toBe('INVALID_CUIT');
    expect(err.httpStatus).toBe(400);
    expect(err.message).toBe('CUIT inválido: 99-99999999-9');
    expect(err.name).toBe('InvalidCuitError');
  });

  it('InvalidEmailError should include the email in the message', () => {
    const err = new InvalidEmailError('not-an-email');
    expect(err.code).toBe('INVALID_EMAIL');
    expect(err.httpStatus).toBe(400);
    expect(err.message).toBe('Email inválido: not-an-email');
  });

  it('InvalidPasswordError should include the reason', () => {
    const err = new InvalidPasswordError('debe tener al menos 8 caracteres');
    expect(err.code).toBe('INVALID_PASSWORD');
    expect(err.httpStatus).toBe(400);
    expect(err.message).toBe('Contraseña inválida: debe tener al menos 8 caracteres');
  });

  it('InvalidRazonSocialError should include the reason', () => {
    const err = new InvalidRazonSocialError('no puede estar vacía');
    expect(err.code).toBe('INVALID_RAZON_SOCIAL');
    expect(err.httpStatus).toBe(400);
    expect(err.message).toBe('Razón social inválida: no puede estar vacía');
  });

  it('InvalidNombreEstudioError should include the reason', () => {
    const err = new InvalidNombreEstudioError('excede 100 caracteres');
    expect(err.code).toBe('INVALID_NOMBRE_ESTUDIO');
    expect(err.httpStatus).toBe(400);
    expect(err.message).toBe('Nombre de estudio inválido: excede 100 caracteres');
  });

  it('all validation exceptions extend DomainException', () => {
    const exceptions = [
      new InvalidCuitError('x'),
      new InvalidEmailError('x'),
      new InvalidPasswordError('x'),
      new InvalidRazonSocialError('x'),
      new InvalidNombreEstudioError('x'),
    ];
    for (const err of exceptions) {
      expect(err).toBeInstanceOf(DomainException);
      expect(err).toBeInstanceOf(Error);
    }
  });
});
