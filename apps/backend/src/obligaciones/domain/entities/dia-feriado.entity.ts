import { z } from 'zod';
import { BaseEntity, reconstituteEntity } from '../../../shared/domain';
import { TIPO_FERIADO } from '@numerito/shared';
import type { TipoFeriado, Jurisdiccion } from '@numerito/shared';

export { TIPO_FERIADO };
export type { TipoFeriado };

const TIPOS_FERIADO = Object.values(TIPO_FERIADO) as [TipoFeriado, ...TipoFeriado[]];

interface CreateDiaFeriadoProps {
  fecha: Date;
  tipo: TipoFeriado;
  descripcion: string;
  jurisdiccionAfectada?: Jurisdiccion | null;
}

const reconstituteSchema = z.object({
  fecha: z.date(),
  tipo: z.enum(TIPOS_FERIADO),
  descripcion: z.string().min(1),
  jurisdiccionAfectada: z.string().nullable(),
});

export type ReconstituteDiaFeriadoProps = z.input<typeof reconstituteSchema>;

export class DiaFeriado extends BaseEntity {
  private _fecha!: Date;
  private _tipo!: TipoFeriado;
  private _descripcion!: string;
  private _jurisdiccionAfectada!: string | null;

  private constructor(props: CreateDiaFeriadoProps, id?: string) {
    super(id);
    this._fecha = props.fecha;
    this._tipo = props.tipo;
    this._descripcion = props.descripcion;
    this._jurisdiccionAfectada = props.jurisdiccionAfectada ?? null;
  }

  static create(props: CreateDiaFeriadoProps, id?: string): DiaFeriado {
    return new DiaFeriado(props, id);
  }

  static reconstitute(props: ReconstituteDiaFeriadoProps, id: string): DiaFeriado {
    const { instance, props: data } = reconstituteEntity(DiaFeriado, {
      schema: reconstituteSchema,
      props,
      id,
    });
    instance._fecha = data.fecha;
    instance._tipo = data.tipo as TipoFeriado;
    instance._descripcion = data.descripcion;
    instance._jurisdiccionAfectada = data.jurisdiccionAfectada;
    return instance;
  }

  get fecha(): Date {
    return this._fecha;
  }
  get tipo(): TipoFeriado {
    return this._tipo;
  }
  get descripcion(): string {
    return this._descripcion;
  }
  get jurisdiccionAfectada(): string | null {
    return this._jurisdiccionAfectada;
  }

  /**
   * Returns true if this feriado affects the given jurisdiccion.
   * NACIONAL feriados affect all jurisdictions.
   * BANCARIO feriados affect all jurisdictions (bank holidays shift fiscal dates).
   * PROVINCIAL/MUNICIPAL only affect their specific jurisdiccion.
   */
  afecta(jurisdiccion: string): boolean {
    if (this._tipo === TIPO_FERIADO.NACIONAL || this._tipo === TIPO_FERIADO.BANCARIO) {
      return true;
    }
    return this._jurisdiccionAfectada === jurisdiccion;
  }
}
