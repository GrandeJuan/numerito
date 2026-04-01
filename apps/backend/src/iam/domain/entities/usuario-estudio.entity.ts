import { BaseEntity } from '../../../shared/domain';
import type { Rol } from '@numerito/shared';

interface CreateUsuarioEstudioProps {
  usuarioId: string;
  estudioId: string;
  rol: Rol;
}

export class UsuarioEstudio extends BaseEntity {
  private _usuarioId: string;
  private _estudioId: string;
  private _rol: Rol;
  private _isActive: boolean;

  private constructor(props: CreateUsuarioEstudioProps, id?: string) {
    super(id);
    this._usuarioId = props.usuarioId;
    this._estudioId = props.estudioId;
    this._rol = props.rol;
    this._isActive = true;
  }

  static create(props: CreateUsuarioEstudioProps, id?: string): UsuarioEstudio {
    return new UsuarioEstudio(props, id);
  }

  get usuarioId(): string {
    return this._usuarioId;
  }

  get estudioId(): string {
    return this._estudioId;
  }

  get rol(): Rol {
    return this._rol;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  changeRol(newRol: Rol): void {
    this._rol = newRol;
    this.updatedAt = new Date();
  }

  deactivate(): void {
    this._isActive = false;
    this.updatedAt = new Date();
  }

  activate(): void {
    this._isActive = true;
    this.updatedAt = new Date();
  }
}
