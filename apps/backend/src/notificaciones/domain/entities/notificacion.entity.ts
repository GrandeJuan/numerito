import { z } from 'zod';
import { BaseEntity, reconstituteEntity } from '../../../shared/domain';

export enum TipoNotificacion {
  VENCIMIENTO_PROXIMO = 'VENCIMIENTO_PROXIMO',
  TAREA_ASIGNADA = 'TAREA_ASIGNADA',
  PAGO_RECIBIDO = 'PAGO_RECIBIDO',
  SISTEMA = 'SISTEMA',
}

interface CreateNotificacionProps {
  usuarioId: string;
  estudioId?: string;
  tipo: TipoNotificacion;
  mensaje: string;
}

const tipoNotificacionValues = Object.values(TipoNotificacion) as [TipoNotificacion, ...TipoNotificacion[]];

const notificacionReconstitutePropsSchema = z.object({
  usuarioId: z.string().min(1),
  estudioId: z.string().optional(),
  tipo: z.enum(tipoNotificacionValues),
  mensaje: z.string(),
  leida: z.boolean(),
});

export type ReconstituteNotificacionProps = z.input<typeof notificacionReconstitutePropsSchema>;

export class Notificacion extends BaseEntity {
  private _usuarioId!: string;
  private _estudioId?: string;
  private _tipo!: TipoNotificacion;
  private _mensaje!: string;
  private _leida!: boolean;

  private constructor(props: CreateNotificacionProps, id?: string) {
    super(id);
    this._usuarioId = props.usuarioId;
    this._estudioId = props.estudioId;
    this._tipo = props.tipo;
    this._mensaje = props.mensaje;
    this._leida = false;
  }

  static create(props: CreateNotificacionProps, id?: string): Notificacion {
    return new Notificacion(props, id);
  }

  static reconstitute(props: ReconstituteNotificacionProps, id: string): Notificacion {
    const { instance, props: data } = reconstituteEntity(Notificacion, {
      schema: notificacionReconstitutePropsSchema,
      props,
      id,
    });
    instance._usuarioId = data.usuarioId;
    instance._estudioId = data.estudioId;
    instance._tipo = data.tipo;
    instance._mensaje = data.mensaje;
    instance._leida = data.leida;
    return instance;
  }

  get usuarioId(): string { return this._usuarioId; }
  get estudioId(): string | undefined { return this._estudioId; }
  get tipo(): TipoNotificacion { return this._tipo; }
  get mensaje(): string { return this._mensaje; }
  get leida(): boolean { return this._leida; }

  marcarLeida(): void {
    this._leida = true;
    this.updatedAt = new Date();
  }
}
