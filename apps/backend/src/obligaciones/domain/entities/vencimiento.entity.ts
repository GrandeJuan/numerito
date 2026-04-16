import { z } from 'zod';
import { BaseEntity, reconstituteEntity } from '../../../shared/domain';
import { OperacionInvalidaError } from '../../../shared/domain/exceptions';
import { ESTADO_VENCIMIENTO, TIPO_OBLIGACION } from '@numerito/shared';
import type { TipoObligacion, EstadoVencimiento } from '@numerito/shared';
import { VencimientoCumplido } from '../events/vencimiento-cumplido.event';
import { VencimientoVencido } from '../events/vencimiento-vencido.event';

export { ESTADO_VENCIMIENTO };
export type { EstadoVencimiento };

interface CreateVencimientoProps {
  clienteId: string;
  estudioId: string;
  tipoObligacion: TipoObligacion;
  periodo: string;
  fechaVencimiento: Date;
  descripcion: string;
}

const tipoObligacionValues = Object.values(TIPO_OBLIGACION) as [TipoObligacion, ...TipoObligacion[]];
const estadoVencimientoValues = Object.values(ESTADO_VENCIMIENTO) as [EstadoVencimiento, ...EstadoVencimiento[]];

const vencimientoReconstitutePropsSchema = z.object({
  clienteId: z.string().min(1),
  estudioId: z.string().min(1),
  tipoObligacion: z.enum(tipoObligacionValues),
  periodo: z.string().min(1),
  fechaVencimiento: z.date(),
  descripcion: z.string(),
  estado: z.enum(estadoVencimientoValues),
});

export type ReconstituteVencimientoProps = z.input<typeof vencimientoReconstitutePropsSchema>;

export class Vencimiento extends BaseEntity {
  private _clienteId!: string;
  private _estudioId!: string;
  private _tipoObligacion!: TipoObligacion;
  private _periodo!: string;
  private _fechaVencimiento!: Date;
  private _descripcion!: string;
  private _estado!: EstadoVencimiento;

  private constructor(props: CreateVencimientoProps, id?: string) {
    super(id);
    if (props.fechaVencimiento < new Date()) {
      throw new OperacionInvalidaError('La fecha de vencimiento no puede ser pasada');
    }
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

  static reconstitute(props: ReconstituteVencimientoProps, id: string): Vencimiento {
    const { instance, props: data } = reconstituteEntity(Vencimiento, {
      schema: vencimientoReconstitutePropsSchema,
      props,
      id,
    });
    instance._clienteId = data.clienteId;
    instance._estudioId = data.estudioId;
    instance._tipoObligacion = data.tipoObligacion;
    instance._periodo = data.periodo;
    instance._fechaVencimiento = data.fechaVencimiento;
    instance._descripcion = data.descripcion;
    instance._estado = data.estado;
    return instance;
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
    this.addDomainEvent(
      new VencimientoCumplido(this.id, this._clienteId, this._tipoObligacion, this._periodo),
    );
  }

  marcarVencido(): void {
    this._estado = ESTADO_VENCIMIENTO.VENCIDO;
    this.updatedAt = new Date();
    this.addDomainEvent(
      new VencimientoVencido(this.id, this._clienteId, this._tipoObligacion, this._periodo),
    );
  }

  isProximoAVencer(diasAnticipacion: number): boolean {
    if (this._estado !== ESTADO_VENCIMIENTO.PENDIENTE) return false;
    const now = new Date();
    const diffMs = this._fechaVencimiento.getTime() - now.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays > 0 && diffDays <= diasAnticipacion;
  }
}
