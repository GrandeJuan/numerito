import { DomainException } from './domain.exception';

export class InvalidCuitError extends DomainException {
  readonly code = 'INVALID_CUIT';
  readonly httpStatus = 400;
  constructor(cuit: string) {
    super(`CUIT inválido: ${cuit}`);
  }
}

export class InvalidEmailError extends DomainException {
  readonly code = 'INVALID_EMAIL';
  readonly httpStatus = 400;
  constructor(email: string) {
    super(`Email inválido: ${email}`);
  }
}

export class InvalidPasswordError extends DomainException {
  readonly code = 'INVALID_PASSWORD';
  readonly httpStatus = 400;
  constructor(reason: string) {
    super(`Contraseña inválida: ${reason}`);
  }
}

export class InvalidRazonSocialError extends DomainException {
  readonly code = 'INVALID_RAZON_SOCIAL';
  readonly httpStatus = 400;
  constructor(reason: string) {
    super(`Razón social inválida: ${reason}`);
  }
}

export class InvalidNombreEstudioError extends DomainException {
  readonly code = 'INVALID_NOMBRE_ESTUDIO';
  readonly httpStatus = 400;
  constructor(reason: string) {
    super(`Nombre de estudio inválido: ${reason}`);
  }
}
