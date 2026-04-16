import { z } from 'zod';
import { BaseEntity, reconstituteEntity } from '../../../shared/domain';

interface CreateSesionProps {
  usuarioId: string;
  refreshToken: string;
  ipAddress: string;
  userAgent: string;
  expiresAt: Date;
}

const sesionReconstitutePropsSchema = z.object({
  usuarioId: z.string().uuid(),
  refreshToken: z.string().min(1),
  ipAddress: z.string(),
  userAgent: z.string(),
  expiresAt: z.date(),
  isActive: z.boolean(),
});

export type ReconstituteSesionProps = z.infer<typeof sesionReconstitutePropsSchema>;

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
    const { instance, props: data } = reconstituteEntity(Sesion, {
      schema: sesionReconstitutePropsSchema,
      props,
      id,
    });
    instance._usuarioId = data.usuarioId;
    instance._refreshToken = data.refreshToken;
    instance._ipAddress = data.ipAddress;
    instance._userAgent = data.userAgent;
    instance._expiresAt = data.expiresAt;
    instance._isActive = data.isActive;
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
