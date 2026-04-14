import { BaseEntity } from '../../../shared/domain';

interface CreateSesionProps {
  usuarioId: string;
  refreshToken: string;
  ipAddress: string;
  userAgent: string;
  expiresAt: Date;
}

interface ReconstituteSesionProps extends CreateSesionProps {
  isActive: boolean;
}

export class Sesion extends BaseEntity {
  private _usuarioId: string;
  private _refreshToken: string;
  private _ipAddress: string;
  private _userAgent: string;
  private _expiresAt: Date;
  private _isActive: boolean;

  private constructor(props: CreateSesionProps, id?: string) {
    super(id);
    this._usuarioId = props.usuarioId;
    this._refreshToken = props.refreshToken;
    this._ipAddress = props.ipAddress;
    this._userAgent = props.userAgent;
    this._expiresAt = props.expiresAt;
    this._isActive = true;
  }

  static create(props: CreateSesionProps, id?: string): Sesion {
    return new Sesion(props, id);
  }

  static reconstitute(props: ReconstituteSesionProps, id: string): Sesion {
    const instance = Object.create(Sesion.prototype) as Sesion;
    Object.defineProperty(instance, 'id', { value: id, writable: false, enumerable: true });
    Object.defineProperty(instance, 'createdAt', { value: new Date(), writable: false, enumerable: true });
    instance.updatedAt = new Date();
    Object.defineProperty(instance, '_domainEvents', { value: [], writable: true, enumerable: false });
    instance._usuarioId = props.usuarioId;
    instance._refreshToken = props.refreshToken;
    instance._ipAddress = props.ipAddress;
    instance._userAgent = props.userAgent;
    instance._expiresAt = props.expiresAt;
    instance._isActive = props.isActive;
    return instance;
  }

  get usuarioId(): string { return this._usuarioId; }
  get refreshToken(): string { return this._refreshToken; }
  get ipAddress(): string { return this._ipAddress; }
  get userAgent(): string { return this._userAgent; }
  get expiresAt(): Date { return this._expiresAt; }
  get isActive(): boolean { return this._isActive; }

  get isExpired(): boolean {
    return this._expiresAt < new Date();
  }

  get isValid(): boolean {
    return this._isActive && !this.isExpired;
  }

  revoke(): void {
    this._isActive = false;
    this.updatedAt = new Date();
  }
}
