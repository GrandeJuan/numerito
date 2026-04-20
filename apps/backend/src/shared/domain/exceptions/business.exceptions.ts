import { DomainException } from './domain.exception';

export class EmailYaRegistradoError extends DomainException {
  readonly code = 'EMAIL_ALREADY_EXISTS';
  readonly httpStatus = 409;
  constructor() {
    super('El email ya está registrado');
  }
}

export class CuitDuplicadoError extends DomainException {
  readonly code = 'CUIT_DUPLICADO';
  readonly httpStatus = 409;
  constructor() {
    super('CUIT ya registrado en este estudio');
  }
}

export class CredencialesInvalidasError extends DomainException {
  readonly code = 'INVALID_CREDENTIALS';
  readonly httpStatus = 401;
  constructor() {
    super('Credenciales inválidas');
  }
}

export class UsuarioInactivoError extends DomainException {
  readonly code = 'USER_INACTIVE';
  readonly httpStatus = 403;
  constructor() {
    super('Usuario inactivo');
  }
}

export class TokenInvalidoError extends DomainException {
  readonly code = 'INVALID_TOKEN';
  readonly httpStatus = 401;
  constructor() {
    super('Token inválido o expirado');
  }
}

export class RecursoNoEncontradoError extends DomainException {
  readonly code = 'NOT_FOUND';
  readonly httpStatus = 404;
  constructor(recurso: string) {
    super(`${recurso} no encontrado`);
  }
}

export class OperacionInvalidaError extends DomainException {
  readonly code = 'INVALID_OPERATION';
  readonly httpStatus = 422;
  constructor(reason: string) {
    super(reason);
  }
}

export class ReglaNoEncontradaError extends DomainException {
  readonly code = 'RULE_NOT_FOUND';
  readonly httpStatus = 404;
  constructor(tipo: string, terminacion: string) {
    super(`No hay regla de vencimiento para ${tipo} con terminación ${terminacion}`);
  }
}

export class UsuarioNoRegistradoSsoError extends DomainException {
  readonly code = 'SSO_USER_NOT_FOUND';
  readonly httpStatus = 404;
  constructor() {
    super('No existe una cuenta con ese email. Registrate o pedí una invitación a tu estudio.');
  }
}

export class TwoFANoConfiguradoError extends DomainException {
  readonly code = '2FA_NOT_CONFIGURED';
  readonly httpStatus = 400;
  constructor() {
    super('2FA no configurado');
  }
}

export class InscripcionDuplicadaError extends DomainException {
  readonly code = 'INSCRIPCION_DUPLICADA';
  readonly httpStatus = 422;
  constructor(jurisdiccion: string, regimen: string) {
    super(`Ya existe una inscripción activa en ${jurisdiccion} / ${regimen}`);
  }
}
