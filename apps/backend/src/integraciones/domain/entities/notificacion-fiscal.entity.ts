import { z } from 'zod';
import { BaseEntity, reconstituteEntity } from '../../../shared/domain';

export const ESTADO_NOTIFICACION = {
  PENDIENTE: 'PENDIENTE',
  LEIDA: 'LEIDA',
  GESTIONADA: 'GESTIONADA',
} as const;

export type EstadoNotificacion = (typeof ESTADO_NOTIFICACION)[keyof typeof ESTADO_NOTIFICACION];

interface CreateNotificacionFiscalProps {
  clienteId: string;
  estudioId: string;
  organismoId: string;
  cuitCliente: string;
  asunto: string;
  contenido: string;
  fechaNotificacion: Date;
}

const estadoNotificacionValues = Object.values(ESTADO_NOTIFICACION) as [EstadoNotificacion, ...EstadoNotificacion[]];

const notificacionFiscalReconstitutePropsSchema = z.object({
  clienteId: z.string().min(1),
  estudioId: z.string().min(1),
  organismoId: z.string(),
  cuitCliente: z.string(),
  asunto: z.string(),
  contenido: z.string(),
  fechaNotificacion: z.date(),
  estado: z.enum(estadoNotificacionValues),
  notaGestion: z.string().optional(),
});

export type ReconstituteNotificacionFiscalProps = z.input<typeof notificacionFiscalReconstitutePropsSchema>;

export class NotificacionFiscal extends BaseEntity {
  private _clienteId!: string;
  private _estudioId!: string;
  private _organismoId!: string;
  private _cuitCliente!: string;
  private _asunto!: string;
  private _contenido!: string;
  private _fechaNotificacion!: Date;
  private _estado!: EstadoNotificacion;
  private _notaGestion?: string;

  private constructor(props: CreateNotificacionFiscalProps, id?: string) {
    super(id);
    this._clienteId = props.clienteId;
    this._estudioId = props.estudioId;
    this._organismoId = props.organismoId;
    this._cuitCliente = props.cuitCliente;
    this._asunto = props.asunto;
    this._contenido = props.contenido;
    this._fechaNotificacion = props.fechaNotificacion;
    this._estado = ESTADO_NOTIFICACION.PENDIENTE;
  }

  static create(props: CreateNotificacionFiscalProps, id?: string): NotificacionFiscal {
    return new NotificacionFiscal(props, id);
  }

  static reconstitute(props: ReconstituteNotificacionFiscalProps, id: string): NotificacionFiscal {
    const { instance, props: data } = reconstituteEntity(NotificacionFiscal, {
      schema: notificacionFiscalReconstitutePropsSchema,
      props,
      id,
    });
    instance._clienteId = data.clienteId;
    instance._estudioId = data.estudioId;
    instance._organismoId = data.organismoId;
    instance._cuitCliente = data.cuitCliente;
    instance._asunto = data.asunto;
    instance._contenido = data.contenido;
    instance._fechaNotificacion = data.fechaNotificacion;
    instance._estado = data.estado;
    instance._notaGestion = data.notaGestion;
    return instance;
  }

  get clienteId(): string { return this._clienteId; }
  get estudioId(): string { return this._estudioId; }
  get organismoId(): string { return this._organismoId; }
  get cuitCliente(): string { return this._cuitCliente; }
  get asunto(): string { return this._asunto; }
  get contenido(): string { return this._contenido; }
  get fechaNotificacion(): Date { return this._fechaNotificacion; }
  get estado(): EstadoNotificacion { return this._estado; }
  get notaGestion(): string | undefined { return this._notaGestion; }

  marcarLeida(): void {
    this._estado = ESTADO_NOTIFICACION.LEIDA;
    this.updatedAt = new Date();
  }

  marcarGestionada(nota: string): void {
    this._estado = ESTADO_NOTIFICACION.GESTIONADA;
    this._notaGestion = nota;
    this.updatedAt = new Date();
  }
}
