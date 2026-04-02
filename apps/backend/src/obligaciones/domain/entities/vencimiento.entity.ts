import { BaseEntity } from '../../../shared/domain';
import { OperacionInvalidaError } from '../../../shared/domain/exceptions';
import type { TipoObligacion } from '@numerito/shared';

export const ESTADO_VENCIMIENTO = {
  PENDIENTE: 'PENDIENTE',
  PRESENTADO: 'PRESENTADO',
  VENCIDO: 'VENCIDO',
} as const;

export type EstadoVencimiento = (typeof ESTADO_VENCIMIENTO)[keyof typeof ESTADO_VENCIMIENTO];

interface CreateVencimientoProps {
  clienteId: string;
  estudioId: string;
  tipoObligacion: TipoObligacion;
  periodo: string;
  fechaVencimiento: Date;
  descripcion: string;
}

export class Vencimiento extends BaseEntity {
  private _clienteId: string;
  private _estudioId: string;
  private _tipoObligacion: TipoObligacion;
  private _periodo: string;
  private _fechaVencimiento: Date;
  private _descripcion: string;
  private _estado: EstadoVencimiento;

  private constructor(props: CreateVencimientoProps, id?: string) {
    super(id);
    this._clienteId = props.clienteId;
    this._estudioId = props.estudioId;
    this._tipoObligacion = props.tipoObligacion;
    this._periodo = props.periodo;
    this._fechaVencimiento = props.fechaVencimiento;
    this._descripcion = props.descripcion;
    this._estado = ESTADO_VENCIMIENTO.PENDIENTE;
  }

  static create(props: CreateVencimientoProps, id?: string): Vencimiento {
    return new Vencimiento(props, id);
  }

  get clienteId(): string { return this._clienteId; }
  get estudioId(): string { return this._estudioId; }
  get tipoObligacion(): TipoObligacion { return this._tipoObligacion; }
  get periodo(): string { return this._periodo; }
  get fechaVencimiento(): Date { return this._fechaVencimiento; }
  get descripcion(): string { return this._descripcion; }
  get estado(): EstadoVencimiento { return this._estado; }

  presentar(): void {
    if (this._estado === ESTADO_VENCIMIENTO.VENCIDO) {
      throw new OperacionInvalidaError('No se puede presentar un vencimiento ya vencido');
    }
    this._estado = ESTADO_VENCIMIENTO.PRESENTADO;
    this.updatedAt = new Date();
  }

  marcarVencido(): void {
    this._estado = ESTADO_VENCIMIENTO.VENCIDO;
    this.updatedAt = new Date();
  }

  isProximoAVencer(diasAnticipacion: number): boolean {
    if (this._estado !== ESTADO_VENCIMIENTO.PENDIENTE) return false;
    const now = new Date();
    const diffMs = this._fechaVencimiento.getTime() - now.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays > 0 && diffDays <= diasAnticipacion;
  }
}
