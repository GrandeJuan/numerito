import { z } from 'zod';
import { BaseEntity, reconstituteEntity } from '../../../shared/domain';
import { OperacionInvalidaError } from '../../../shared/domain/exceptions';
import { ESTADO_VENCIMIENTO, TIPO_OBLIGACION } from '@numerito/shared';
import type { TipoObligacion, EstadoVencimiento } from '@numerito/shared';
import { VencimientoCumplido } from '../events/vencimiento-cumplido.event';
import { VencimientoVencido } from '../events/vencimiento-vencido.event';
import { VencimientoProrrogado } from '../events/vencimiento-prorrogado.event';

export { ESTADO_VENCIMIENTO };
export type { EstadoVencimiento };

interface CreateVencimientoProps {
  clienteId: string;
  estudioId: string;
  tipoObligacion: TipoObligacion;
  periodo: string;
  fechaVencimiento: Date;
  fechaNominal?: Date | null;
  descripcion: string;
  responsableId?: string | null;
}

const tipoObligacionValues = Object.values(TIPO_OBLIGACION) as [
  TipoObligacion,
  ...TipoObligacion[],
];
const estadoVencimientoValues = Object.values(ESTADO_VENCIMIENTO) as [
  EstadoVencimiento,
  ...EstadoVencimiento[],
];

const vencimientoReconstitutePropsSchema = z.object({
  clienteId: z.string().min(1),
  estudioId: z.string().min(1),
  tipoObligacion: z.enum(tipoObligacionValues),
  periodo: z.string().min(1),
  fechaVencimiento: z.date(),
  fechaNominal: z.date().nullable(),
  descripcion: z.string(),
  estado: z.enum(estadoVencimientoValues),
  motivo: z.string().nullable(),
  fechaProrrogada: z.date().nullable(),
  responsableId: z.string().nullable(),
});

export type ReconstituteVencimientoProps = z.input<typeof vencimientoReconstitutePropsSchema>;

export class Vencimiento extends BaseEntity {
  private _clienteId!: string;
  private _estudioId!: string;
  private _tipoObligacion!: TipoObligacion;
  private _periodo!: string;
  private _fechaVencimiento!: Date;
  private _fechaNominal!: Date | null;
  private _descripcion!: string;
  private _estado!: EstadoVencimiento;
  private _motivo!: string | null;
  private _fechaProrrogada!: Date | null;
  private _responsableId!: string | null;

  private constructor(props: CreateVencimientoProps, id?: string) {
    super(id);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDay = new Date(props.fechaVencimiento);
    dueDay.setHours(0, 0, 0, 0);
    if (dueDay < today) {
      throw new OperacionInvalidaError('La fecha de vencimiento no puede ser pasada');
    }
    if (props.fechaNominal) {
      const nominalDay = new Date(props.fechaNominal);
      nominalDay.setHours(0, 0, 0, 0);
      if (nominalDay > dueDay) {
        throw new OperacionInvalidaError('La fecha nominal no puede ser posterior a la fecha ajustada');
      }
    }
    this._clienteId = props.clienteId;
    this._estudioId = props.estudioId;
    this._tipoObligacion = props.tipoObligacion;
    this._periodo = props.periodo;
    this._fechaVencimiento = props.fechaVencimiento;
    this._fechaNominal = props.fechaNominal ?? null;
    this._descripcion = props.descripcion;
    this._estado = ESTADO_VENCIMIENTO.PENDIENTE;
    this._motivo = null;
    this._fechaProrrogada = null;
    this._responsableId = props.responsableId ?? null;
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
    instance._fechaNominal = data.fechaNominal;
    instance._descripcion = data.descripcion;
    instance._estado = data.estado;
    instance._motivo = data.motivo;
    instance._fechaProrrogada = data.fechaProrrogada;
    instance._responsableId = data.responsableId;
    return instance;
  }

  get clienteId(): string {
    return this._clienteId;
  }
  get estudioId(): string {
    return this._estudioId;
  }
  get tipoObligacion(): TipoObligacion {
    return this._tipoObligacion;
  }
  get periodo(): string {
    return this._periodo;
  }
  get fechaVencimiento(): Date {
    return this._fechaVencimiento;
  }
  get fechaNominal(): Date | null {
    return this._fechaNominal;
  }
  get descripcion(): string {
    return this._descripcion;
  }
  get estado(): EstadoVencimiento {
    return this._estado;
  }
  get motivo(): string | null {
    return this._motivo;
  }
  get fechaProrrogada(): Date | null {
    return this._fechaProrrogada;
  }
  get responsableId(): string | null {
    return this._responsableId;
  }

  private static readonly ESTADOS_TERMINALES: ReadonlySet<EstadoVencimiento> = new Set([
    ESTADO_VENCIMIENTO.PRESENTADO,
    ESTADO_VENCIMIENTO.VENCIDO,
    ESTADO_VENCIMIENTO.NO_APLICA,
  ]);

  presentar(): void {
    if (
      this._estado !== ESTADO_VENCIMIENTO.PENDIENTE &&
      this._estado !== ESTADO_VENCIMIENTO.PRORROGADO
    ) {
      throw new OperacionInvalidaError(
        'Solo se puede presentar un vencimiento en estado PENDIENTE o PRORROGADO',
      );
    }
    this._estado = ESTADO_VENCIMIENTO.PRESENTADO;
    this.updatedAt = new Date();
    this.addDomainEvent(
      new VencimientoCumplido(this.id, this._clienteId, this._tipoObligacion, this._periodo),
    );
  }

  marcarVencido(): void {
    if (Vencimiento.ESTADOS_TERMINALES.has(this._estado)) {
      throw new OperacionInvalidaError(
        `No se puede marcar como vencido un vencimiento en estado ${this._estado}`,
      );
    }
    this._estado = ESTADO_VENCIMIENTO.VENCIDO;
    this.updatedAt = new Date();
    this.addDomainEvent(
      new VencimientoVencido(this.id, this._clienteId, this._tipoObligacion, this._periodo),
    );
  }

  prorrogar(motivo: string, nuevaFecha: Date): void {
    if (this._estado !== ESTADO_VENCIMIENTO.PENDIENTE) {
      throw new OperacionInvalidaError(
        'Solo se puede prorrogar un vencimiento en estado PENDIENTE',
      );
    }
    if (!motivo || motivo.trim().length === 0) {
      throw new OperacionInvalidaError('El motivo de la prórroga es obligatorio');
    }
    this._estado = ESTADO_VENCIMIENTO.PRORROGADO;
    this._motivo = motivo.trim();
    this._fechaProrrogada = nuevaFecha;
    this.updatedAt = new Date();
    this.addDomainEvent(
      new VencimientoProrrogado(
        this.id,
        this._clienteId,
        this._tipoObligacion,
        this._periodo,
        this._motivo,
        nuevaFecha,
      ),
    );
  }

  marcarNoAplica(motivo: string): void {
    if (this._estado !== ESTADO_VENCIMIENTO.PENDIENTE) {
      throw new OperacionInvalidaError(
        'Solo se puede marcar como no aplica un vencimiento en estado PENDIENTE',
      );
    }
    if (!motivo || motivo.trim().length === 0) {
      throw new OperacionInvalidaError('El motivo es obligatorio para marcar como no aplica');
    }
    this._estado = ESTADO_VENCIMIENTO.NO_APLICA;
    this._motivo = motivo.trim();
    this.updatedAt = new Date();
  }

  reasignarResponsable(responsableId: string): void {
    this._responsableId = responsableId;
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
