import { z } from 'zod';
import { BaseEntity, reconstituteEntity } from '../../../shared/domain';
import { JURISDICCION, FRECUENCIA_OBLIGACION } from '@numerito/shared';
import type { Jurisdiccion, FrecuenciaObligacion, TipoObligacion } from '@numerito/shared';

const jurisdiccionValues = Object.values(JURISDICCION) as [string, ...string[]];
const frecuenciaValues = Object.values(FRECUENCIA_OBLIGACION) as [string, ...string[]];

interface CreateCatalogoObligacionProps {
  nombre: string;
  tipoObligacion: TipoObligacion;
  jurisdiccion: Jurisdiccion;
  frecuencia: FrecuenciaObligacion;
  activo?: boolean;
}

const reconstituteSchema = z.object({
  nombre: z.string().min(1),
  tipoObligacion: z.string().min(1),
  jurisdiccion: z.enum(jurisdiccionValues),
  frecuencia: z.enum(frecuenciaValues),
  activo: z.boolean(),
});

export type ReconstituteCatalogoObligacionProps = z.input<typeof reconstituteSchema>;

export class CatalogoObligacion extends BaseEntity {
  private _nombre!: string;
  private _tipoObligacion!: TipoObligacion;
  private _jurisdiccion!: Jurisdiccion;
  private _frecuencia!: FrecuenciaObligacion;
  private _activo!: boolean;

  private constructor(props: CreateCatalogoObligacionProps, id?: string) {
    super(id);
    this._nombre = props.nombre;
    this._tipoObligacion = props.tipoObligacion;
    this._jurisdiccion = props.jurisdiccion;
    this._frecuencia = props.frecuencia;
    this._activo = props.activo ?? true;
  }

  static create(props: CreateCatalogoObligacionProps, id?: string): CatalogoObligacion {
    return new CatalogoObligacion(props, id);
  }

  static reconstitute(props: ReconstituteCatalogoObligacionProps, id: string): CatalogoObligacion {
    const { instance, props: data } = reconstituteEntity(CatalogoObligacion, {
      schema: reconstituteSchema,
      props,
      id,
    });
    instance._nombre = data.nombre;
    instance._tipoObligacion = data.tipoObligacion as TipoObligacion;
    instance._jurisdiccion = data.jurisdiccion as Jurisdiccion;
    instance._frecuencia = data.frecuencia as FrecuenciaObligacion;
    instance._activo = data.activo;
    return instance;
  }

  get nombre(): string {
    return this._nombre;
  }
  get tipoObligacion(): TipoObligacion {
    return this._tipoObligacion;
  }
  get jurisdiccion(): Jurisdiccion {
    return this._jurisdiccion;
  }
  get frecuencia(): FrecuenciaObligacion {
    return this._frecuencia;
  }
  get activo(): boolean {
    return this._activo;
  }

  actualizar(props: { nombre?: string; activo?: boolean }): void {
    if (props.nombre !== undefined) this._nombre = props.nombre;
    if (props.activo !== undefined) this._activo = props.activo;
    this.updatedAt = new Date();
  }

  desactivar(): void {
    this._activo = false;
    this.updatedAt = new Date();
  }

  activar(): void {
    this._activo = true;
    this.updatedAt = new Date();
  }
}
