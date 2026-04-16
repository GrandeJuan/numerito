import { z } from 'zod';
import { BaseEntity, reconstituteEntity } from '../../../shared/domain';
import { ROL } from '@numerito/shared';
import type { Rol } from '@numerito/shared';

interface CreateUsuarioEstudioProps {
  usuarioId: string;
  estudioId: string;
  rol: Rol;
}

const rolValues = Object.values(ROL) as [Rol, ...Rol[]];

const usuarioEstudioReconstitutePropsSchema = z.object({
  usuarioId: z.string().min(1),
  estudioId: z.string().min(1),
  rol: z.enum(rolValues),
  isActive: z.boolean(),
});

export type ReconstituteUsuarioEstudioProps = z.input<typeof usuarioEstudioReconstitutePropsSchema>;

export class UsuarioEstudio extends BaseEntity {
  private _usuarioId!: string;
  private _estudioId!: string;
  private _rol!: Rol;
  private _isActive!: boolean;

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
    const { instance, props: data } = reconstituteEntity(UsuarioEstudio, {
      schema: usuarioEstudioReconstitutePropsSchema,
      props,
      id,
    });
    instance._usuarioId = data.usuarioId;
    instance._estudioId = data.estudioId;
    instance._rol = data.rol;
    instance._isActive = data.isActive;
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
