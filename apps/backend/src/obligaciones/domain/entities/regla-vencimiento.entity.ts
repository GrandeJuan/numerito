import { z } from 'zod';
import { BaseEntity, reconstituteEntity } from '../../../shared/domain';
import { OperacionInvalidaError } from '../../../shared/domain/exceptions';
import {
  ESTADO_REGLA,
  ORIGEN_REGLA,
  JURISDICCION,
} from '@numerito/shared';
import type {
  TipoObligacion,
  Jurisdiccion,
  EstadoRegla,
  OrigenRegla,
} from '@numerito/shared';

const jurisdiccionValues = Object.values(JURISDICCION) as [string, ...string[]];
const estadoReglaValues = Object.values(ESTADO_REGLA) as [string, ...string[]];
const origenReglaValues = Object.values(ORIGEN_REGLA) as [string, ...string[]];

export { ESTADO_REGLA, ORIGEN_REGLA };
export type { EstadoRegla, OrigenRegla };

interface CreateReglaVencimientoProps {
  tipoObligacion: TipoObligacion;
  jurisdiccion: Jurisdiccion;
  regimen: string;
  terminacionCuit: string;
  diaVencimiento: number;
  mesSiguiente: boolean;
  vigenciaDesde: Date;
  vigenciaHasta?: Date | null;
  origen?: OrigenRegla;
  estado?: EstadoRegla;
}

const reconstituteSchema = z.object({
  tipoObligacion: z.string().min(1),
  jurisdiccion: z.enum(jurisdiccionValues),
  regimen: z.string().min(1),
  terminacionCuit: z.string().length(1),
  diaVencimiento: z.number().int().min(1).max(31),
  mesSiguiente: z.boolean(),
  vigenciaDesde: z.date(),
  vigenciaHasta: z.date().nullable(),
  origen: z.enum(origenReglaValues),
  estado: z.enum(estadoReglaValues),
});

export type ReconstituteReglaVencimientoProps = z.input<typeof reconstituteSchema>;

export class ReglaVencimiento extends BaseEntity {
  private _tipoObligacion!: TipoObligacion;
  private _jurisdiccion!: Jurisdiccion;
  private _regimen!: string;
  private _terminacionCuit!: string;
  private _diaVencimiento!: number;
  private _mesSiguiente!: boolean;
  private _vigenciaDesde!: Date;
  private _vigenciaHasta!: Date | null;
  private _origen!: OrigenRegla;
  private _estado!: EstadoRegla;

  private constructor(props: CreateReglaVencimientoProps, id?: string) {
    super(id);
    if (props.diaVencimiento < 1 || props.diaVencimiento > 31) {
      throw new OperacionInvalidaError('Día de vencimiento debe estar entre 1 y 31');
    }
    if (props.terminacionCuit.length !== 1) {
      throw new OperacionInvalidaError('Terminación de CUIT debe ser un solo dígito');
    }
    if (props.vigenciaHasta && props.vigenciaHasta < props.vigenciaDesde) {
      throw new OperacionInvalidaError('vigenciaHasta no puede ser anterior a vigenciaDesde');
    }
    this._tipoObligacion = props.tipoObligacion;
    this._jurisdiccion = props.jurisdiccion;
    this._regimen = props.regimen;
    this._terminacionCuit = props.terminacionCuit;
    this._diaVencimiento = props.diaVencimiento;
    this._mesSiguiente = props.mesSiguiente;
    this._vigenciaDesde = props.vigenciaDesde;
    this._vigenciaHasta = props.vigenciaHasta ?? null;
    this._origen = props.origen ?? ORIGEN_REGLA.MANUAL;
    this._estado = props.estado ?? ESTADO_REGLA.ACTIVA;
  }

  static create(props: CreateReglaVencimientoProps, id?: string): ReglaVencimiento {
    return new ReglaVencimiento(props, id);
  }

  static reconstitute(props: ReconstituteReglaVencimientoProps, id: string): ReglaVencimiento {
    const { instance, props: data } = reconstituteEntity(ReglaVencimiento, {
      schema: reconstituteSchema,
      props,
      id,
    });
    instance._tipoObligacion = data.tipoObligacion as TipoObligacion;
    instance._jurisdiccion = data.jurisdiccion as Jurisdiccion;
    instance._regimen = data.regimen;
    instance._terminacionCuit = data.terminacionCuit;
    instance._diaVencimiento = data.diaVencimiento;
    instance._mesSiguiente = data.mesSiguiente;
    instance._vigenciaDesde = data.vigenciaDesde;
    instance._vigenciaHasta = data.vigenciaHasta;
    instance._origen = data.origen as OrigenRegla;
    instance._estado = data.estado as EstadoRegla;
    return instance;
  }

  get tipoObligacion(): TipoObligacion { return this._tipoObligacion; }
  get jurisdiccion(): Jurisdiccion { return this._jurisdiccion; }
  get regimen(): string { return this._regimen; }
  get terminacionCuit(): string { return this._terminacionCuit; }
  get diaVencimiento(): number { return this._diaVencimiento; }
  get mesSiguiente(): boolean { return this._mesSiguiente; }
  get vigenciaDesde(): Date { return this._vigenciaDesde; }
  get vigenciaHasta(): Date | null { return this._vigenciaHasta; }
  get origen(): OrigenRegla { return this._origen; }
  get estado(): EstadoRegla { return this._estado; }

  /** Returns true if the rule is vigente (active and within its vigencia range) at the given date */
  isVigenteAt(fecha: Date): boolean {
    if (this._estado !== ESTADO_REGLA.ACTIVA) return false;
    if (fecha < this._vigenciaDesde) return false;
    if (this._vigenciaHasta && fecha > this._vigenciaHasta) return false;
    return true;
  }

  /** Returns true if this rule's vigencia overlaps with the given range */
  vigenciaSolapa(desde: Date, hasta: Date | null): boolean {
    const thisHasta = this._vigenciaHasta ?? new Date('9999-12-31');
    const otherHasta = hasta ?? new Date('9999-12-31');
    return this._vigenciaDesde <= otherHasta && thisHasta >= desde;
  }

  /** Check if this rule conflicts with another (same natural key + overlapping active vigencia) */
  conflictsWith(other: ReglaVencimiento): boolean {
    if (this.id === other.id) return false;
    if (this._estado !== ESTADO_REGLA.ACTIVA || other._estado !== ESTADO_REGLA.ACTIVA) return false;
    if (this._tipoObligacion !== other._tipoObligacion) return false;
    if (this._jurisdiccion !== other._jurisdiccion) return false;
    if (this._regimen !== other._regimen) return false;
    if (this._terminacionCuit !== other._terminacionCuit) return false;
    return this.vigenciaSolapa(other._vigenciaDesde, other._vigenciaHasta);
  }

  aprobar(): void {
    if (this._estado !== ESTADO_REGLA.PROPUESTA) {
      throw new OperacionInvalidaError('Solo se pueden aprobar reglas en estado PROPUESTA');
    }
    this._estado = ESTADO_REGLA.ACTIVA;
    this.updatedAt = new Date();
  }

  rechazar(): void {
    if (this._estado !== ESTADO_REGLA.PROPUESTA) {
      throw new OperacionInvalidaError('Solo se pueden rechazar reglas en estado PROPUESTA');
    }
    this._estado = ESTADO_REGLA.RECHAZADA;
    this.updatedAt = new Date();
  }

  cerrarVigencia(fecha: Date): void {
    this._vigenciaHasta = fecha;
    this.updatedAt = new Date();
  }

  /** Calculates the due date for a given fiscal period (YYYY-MM format) */
  calcularFecha(periodo: string): Date {
    const [year, month] = periodo.split('-').map(Number);
    const targetMonth = this._mesSiguiente ? month : month - 1;
    const anio = targetMonth === 12 ? year + 1 : year;
    const mes = targetMonth === 12 ? 0 : targetMonth;
    return new Date(anio, mes, this._diaVencimiento);
  }
}
