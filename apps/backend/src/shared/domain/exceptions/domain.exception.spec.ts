import { DomainException } from './domain.exception';
import {
  EmailYaRegistradoError,
  CuitDuplicadoError,
  CredencialesInvalidasError,
  UsuarioInactivoError,
  TokenInvalidoError,
  RecursoNoEncontradoError,
  OperacionInvalidaError,
  ReglaNoEncontradaError,
  TwoFANoConfiguradoError,
} from './business.exceptions';
import {
  InvalidCuitError,
  InvalidEmailError,
  InvalidPasswordError,
  InvalidRazonSocialError,
  InvalidNombreEstudioError,
} from './validation.exceptions';

describe('DomainException', () => {
  it('should set name to constructor name', () => {
    const err = new EmailYaRegistradoError();
    expect(err.name).toBe('EmailYaRegistradoError');
    expect(err).toBeInstanceOf(DomainException);
    expect(err).toBeInstanceOf(Error);
  });
});

describe('Business exceptions', () => {
  it('EmailYaRegistradoError', () => {
    const e = new EmailYaRegistradoError();
    expect(e.code).toBe('EMAIL_ALREADY_EXISTS');
    expect(e.httpStatus).toBe(409);
    expect(e.message).toBe('El email ya está registrado');
  });

  it('CuitDuplicadoError', () => {
    const e = new CuitDuplicadoError();
    expect(e.code).toBe('CUIT_DUPLICADO');
    expect(e.httpStatus).toBe(409);
  });

  it('CredencialesInvalidasError', () => {
    const e = new CredencialesInvalidasError();
    expect(e.code).toBe('INVALID_CREDENTIALS');
    expect(e.httpStatus).toBe(401);
  });

  it('UsuarioInactivoError', () => {
    const e = new UsuarioInactivoError();
    expect(e.code).toBe('USER_INACTIVE');
    expect(e.httpStatus).toBe(403);
  });

  it('TokenInvalidoError', () => {
    const e = new TokenInvalidoError();
    expect(e.code).toBe('INVALID_TOKEN');
    expect(e.httpStatus).toBe(401);
  });

  it('RecursoNoEncontradoError', () => {
    const e = new RecursoNoEncontradoError('Cliente');
    expect(e.message).toBe('Cliente no encontrado');
    expect(e.httpStatus).toBe(404);
  });

  it('OperacionInvalidaError', () => {
    const e = new OperacionInvalidaError('reason');
    expect(e.code).toBe('INVALID_OPERATION');
    expect(e.httpStatus).toBe(422);
  });

  it('ReglaNoEncontradaError', () => {
    const e = new ReglaNoEncontradaError('IVA', '0');
    expect(e.message).toContain('IVA');
    expect(e.message).toContain('0');
    expect(e.httpStatus).toBe(404);
  });

  it('TwoFANoConfiguradoError', () => {
    const e = new TwoFANoConfiguradoError();
    expect(e.code).toBe('2FA_NOT_CONFIGURED');
    expect(e.httpStatus).toBe(400);
  });
});

describe('Validation exceptions', () => {
  it('InvalidCuitError', () => {
    const e = new InvalidCuitError('123');
    expect(e.code).toBe('INVALID_CUIT');
    expect(e.httpStatus).toBe(400);
    expect(e.message).toContain('123');
  });

  it('InvalidEmailError', () => {
    const e = new InvalidEmailError('bad');
    expect(e.code).toBe('INVALID_EMAIL');
    expect(e.httpStatus).toBe(400);
  });

  it('InvalidPasswordError', () => {
    const e = new InvalidPasswordError('too short');
    expect(e.code).toBe('INVALID_PASSWORD');
    expect(e.httpStatus).toBe(400);
  });

  it('InvalidRazonSocialError', () => {
    const e = new InvalidRazonSocialError('empty');
    expect(e.code).toBe('INVALID_RAZON_SOCIAL');
    expect(e.httpStatus).toBe(400);
  });

  it('InvalidNombreEstudioError', () => {
    const e = new InvalidNombreEstudioError('empty');
    expect(e.code).toBe('INVALID_NOMBRE_ESTUDIO');
    expect(e.httpStatus).toBe(400);
  });
});
