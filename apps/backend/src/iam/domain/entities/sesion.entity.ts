import { BaseEntity } from '../../../shared/domain';

interface CreateSesionProps {
  usuarioId: string;
  refreshToken: string;
  ipAddress: string;
  userAgent: string;
  expiresAt: Date;
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
