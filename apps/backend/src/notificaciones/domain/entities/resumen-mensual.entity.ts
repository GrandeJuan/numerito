import { z } from 'zod';
import { BaseEntity, reconstituteEntity } from '../../../shared/domain';

export enum EstadoResumen {
  GENERANDO = 'GENERANDO',
  LISTO = 'LISTO',
  ERROR = 'ERROR',
}

interface CreateResumenMensualProps {
  estudioId: string;
  clienteId: string;
  clienteNombre: string;
  periodo: string; // YYYY-MM
  totalVencimientos: number;
}

const estadoValues = Object.values(EstadoResumen) as [EstadoResumen, ...EstadoResumen[]];

const reconstitutePropsSchema = z.object({
  estudioId: z.string().min(1),
  clienteId: z.string().min(1),
  clienteNombre: z.string().min(1),
  periodo: z.string().regex(/^\d{4}-\d{2}$/),
  totalVencimientos: z.number().int().nonnegative(),
  estado: z.enum(estadoValues),
  pdfBuffer: z.instanceof(Buffer).nullable(),
  emailEnviado: z.boolean(),
  errorMensaje: z.string().nullable(),
});

export type ReconstituteResumenMensualProps = z.input<typeof reconstitutePropsSchema>;

export class ResumenMensual extends BaseEntity {
  private _estudioId!: string;
  private _clienteId!: string;
  private _clienteNombre!: string;
  private _periodo!: string;
  private _totalVencimientos!: number;
  private _estado!: EstadoResumen;
  private _pdfBuffer!: Buffer | null;
  private _emailEnviado!: boolean;
  private _errorMensaje!: string | null;

  private constructor(props: CreateResumenMensualProps, id?: string) {
    super(id);
    this._estudioId = props.estudioId;
    this._clienteId = props.clienteId;
    this._clienteNombre = props.clienteNombre;
    this._periodo = props.periodo;
    this._totalVencimientos = props.totalVencimientos;
    this._estado = EstadoResumen.GENERANDO;
    this._pdfBuffer = null;
    this._emailEnviado = false;
    this._errorMensaje = null;
  }

  static create(props: CreateResumenMensualProps, id?: string): ResumenMensual {
    return new ResumenMensual(props, id);
  }

  static reconstitute(props: ReconstituteResumenMensualProps, id: string): ResumenMensual {
    const { instance, props: data } = reconstituteEntity(ResumenMensual, {
      schema: reconstitutePropsSchema,
      props,
      id,
    });
    instance._estudioId = data.estudioId;
    instance._clienteId = data.clienteId;
    instance._clienteNombre = data.clienteNombre;
    instance._periodo = data.periodo;
    instance._totalVencimientos = data.totalVencimientos;
    instance._estado = data.estado;
    instance._pdfBuffer = data.pdfBuffer;
    instance._emailEnviado = data.emailEnviado;
    instance._errorMensaje = data.errorMensaje;
    return instance;
  }

  get estudioId(): string { return this._estudioId; }
  get clienteId(): string { return this._clienteId; }
  get clienteNombre(): string { return this._clienteNombre; }
  get periodo(): string { return this._periodo; }
  get totalVencimientos(): number { return this._totalVencimientos; }
  get estado(): EstadoResumen { return this._estado; }
  get pdfBuffer(): Buffer | null { return this._pdfBuffer; }
  get emailEnviado(): boolean { return this._emailEnviado; }
  get errorMensaje(): string | null { return this._errorMensaje; }

  marcarListo(pdfBuffer: Buffer): void {
    this._estado = EstadoResumen.LISTO;
    this._pdfBuffer = pdfBuffer;
    this.updatedAt = new Date();
  }

  marcarEmailEnviado(): void {
    this._emailEnviado = true;
    this.updatedAt = new Date();
  }

  marcarError(mensaje: string): void {
    this._estado = EstadoResumen.ERROR;
    this._errorMensaje = mensaje;
    this.updatedAt = new Date();
  }
}
