import {
  EmailYaRegistradoError,
  CuitDuplicadoError,
  CredencialesInvalidasError,
  UsuarioInactivoError,
  TokenInvalidoError,
  RecursoNoEncontradoError,
  OperacionInvalidaError,
  ReglaNoEncontradaError,
  UsuarioNoRegistradoSsoError,
  TwoFANoConfiguradoError,
} from './business.exceptions';
import { DomainException } from './domain.exception';

describe('Business Exceptions', () => {
  it.each([
    { Exc: EmailYaRegistradoError, code: 'EMAIL_ALREADY_EXISTS', status: 409, msg: 'El email ya está registrado' },
    { Exc: CuitDuplicadoError, code: 'CUIT_DUPLICADO', status: 409, msg: 'CUIT ya registrado en este estudio' },
    { Exc: CredencialesInvalidasError, code: 'INVALID_CREDENTIALS', status: 401, msg: 'Credenciales inválidas' },
    { Exc: UsuarioInactivoError, code: 'USER_INACTIVE', status: 403, msg: 'Usuario inactivo' },
    { Exc: TokenInvalidoError, code: 'INVALID_TOKEN', status: 401, msg: 'Token inválido o expirado' },
    { Exc: UsuarioNoRegistradoSsoError, code: 'SSO_USER_NOT_FOUND', status: 404, msg: /No existe una cuenta/ },
    { Exc: TwoFANoConfiguradoError, code: '2FA_NOT_CONFIGURED', status: 400, msg: '2FA no configurado' },
  ])('$Exc.name should have code=$code, httpStatus=$status', ({ Exc, code, status, msg }) => {
    const err = new (Exc as any)();
    expect(err).toBeInstanceOf(DomainException);
    expect(err).toBeInstanceOf(Error);
    expect(err.code).toBe(code);
    expect(err.httpStatus).toBe(status);
    if (typeof msg === 'string') {
      expect(err.message).toBe(msg);
    } else {
      expect(err.message).toMatch(msg);
    }
    expect(err.name).toBe(Exc.name);
  });

  it('RecursoNoEncontradoError should include resource name in message', () => {
    const err = new RecursoNoEncontradoError('Cliente');
    expect(err.code).toBe('NOT_FOUND');
    expect(err.httpStatus).toBe(404);
    expect(err.message).toBe('Cliente no encontrado');
  });

  it('OperacionInvalidaError should include reason in message', () => {
    const err = new OperacionInvalidaError('No se puede eliminar un estudio activo');
    expect(err.code).toBe('INVALID_OPERATION');
    expect(err.httpStatus).toBe(422);
    expect(err.message).toBe('No se puede eliminar un estudio activo');
  });

  it('ReglaNoEncontradaError should include tipo and terminacion', () => {
    const err = new ReglaNoEncontradaError('IVA', '3');
    expect(err.code).toBe('RULE_NOT_FOUND');
    expect(err.httpStatus).toBe(404);
    expect(err.message).toBe('No hay regla de vencimiento para IVA con terminación 3');
  });
});
