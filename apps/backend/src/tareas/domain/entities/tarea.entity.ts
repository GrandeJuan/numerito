import { BaseEntity } from '../../../shared/domain';
import { OperacionInvalidaError } from '../../../shared/domain/exceptions';

export const ESTADO_TAREA = {
  PENDIENTE: 'PENDIENTE',
  EN_PROGRESO: 'EN_PROGRESO',
  COMPLETADO: 'COMPLETADO',
} as const;

export type EstadoTarea = (typeof ESTADO_TAREA)[keyof typeof ESTADO_TAREA];

export const PRIORIDAD = {
  BAJA: 'BAJA',
  MEDIA: 'MEDIA',
  ALTA: 'ALTA',
  URGENTE: 'URGENTE',
} as const;

export type Prioridad = (typeof PRIORIDAD)[keyof typeof PRIORIDAD];

interface Comentario {
  usuarioId: string;
  texto: string;
  fecha: Date;
}

interface CreateTareaProps {
  titulo: string;
  clienteId?: string;
  estudioId: string;
  prioridad: Prioridad;
  descripcion?: string;
}

export class Tarea extends BaseEntity {
  private _titulo: string;
  private _descripcion?: string;
  private _clienteId?: string;
  private _estudioId: string;
  private _estado: EstadoTarea;
  private _prioridad: Prioridad;
  private _responsableId?: string;
  private _horasRegistradas: number;
  private _comentarios: Comentario[];

  private constructor(props: CreateTareaProps, id?: string) {
    super(id);
    this._titulo = props.titulo;
    this._descripcion = props.descripcion;
    this._clienteId = props.clienteId;
    this._estudioId = props.estudioId;
    this._estado = ESTADO_TAREA.PENDIENTE;
    this._prioridad = props.prioridad;
    this._horasRegistradas = 0;
    this._comentarios = [];
  }

  static create(props: CreateTareaProps, id?: string): Tarea {
    return new Tarea(props, id);
  }

  get titulo(): string { return this._titulo; }
  get descripcion(): string | undefined { return this._descripcion; }
  get clienteId(): string | undefined { return this._clienteId; }
  get estudioId(): string { return this._estudioId; }
  get estado(): EstadoTarea { return this._estado; }
  get prioridad(): Prioridad { return this._prioridad; }
  get responsableId(): string | undefined { return this._responsableId; }
  get horasRegistradas(): number { return this._horasRegistradas; }
  get comentarios(): Comentario[] { return [...this._comentarios]; }

  iniciar(): void {
    this._estado = ESTADO_TAREA.EN_PROGRESO;
    this.updatedAt = new Date();
  }

  completar(): void {
    if (this._estado !== ESTADO_TAREA.EN_PROGRESO) {
      throw new OperacionInvalidaError('Solo se puede completar una tarea en progreso');
    }
    this._estado = ESTADO_TAREA.COMPLETADO;
    this.updatedAt = new Date();
  }

  asignar(responsableId: string): void {
    this._responsableId = responsableId;
    this.updatedAt = new Date();
  }

  registrarHoras(horas: number): void {
    if (horas <= 0) {
      throw new OperacionInvalidaError('Las horas deben ser mayor a 0');
    }
    this._horasRegistradas += horas;
    this.updatedAt = new Date();
  }

  agregarComentario(usuarioId: string, texto: string): void {
    this._comentarios.push({ usuarioId, texto, fecha: new Date() });
    this.updatedAt = new Date();
  }
}
