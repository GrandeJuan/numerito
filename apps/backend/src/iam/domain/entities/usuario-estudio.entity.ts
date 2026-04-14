import { BaseEntity } from '../../../shared/domain';
import type { Rol } from '@numerito/shared';

interface CreateUsuarioEstudioProps {
  usuarioId: string;
  estudioId: string;
  rol: Rol;
}

interface ReconstituteUsuarioEstudioProps extends CreateUsuarioEstudioProps {
  isActive: boolean;
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

  static reconstitute(props: ReconstituteUsuarioEstudioProps, id: string): UsuarioEstudio {
    const instance = Object.create(UsuarioEstudio.prototype) as UsuarioEstudio;
    Object.defineProperty(instance, 'id', { value: id, writable: false, enumerable: true });
    Object.defineProperty(instance, 'createdAt', { value: new Date(), writable: false, enumerable: true });
    instance.updatedAt = new Date();
    Object.defineProperty(instance, '_domainEvents', { value: [], writable: true, enumerable: false });
    instance._usuarioId = props.usuarioId;
    instance._estudioId = props.estudioId;
    instance._rol = props.rol;
    instance._isActive = props.isActive;
    return instance;
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
