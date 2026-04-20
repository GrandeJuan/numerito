import { z } from 'zod';
import { BaseEntity, reconstituteEntity } from '../../../shared/domain';
import { OperacionInvalidaError } from '../../../shared/domain/exceptions';

export const ESTADO_SUGERENCIA = {
  ABIERTA: 'ABIERTA',
  APROBADA: 'APROBADA',
  DESCARTADA: 'DESCARTADA',
} as const;

export type EstadoSugerencia = (typeof ESTADO_SUGERENCIA)[keyof typeof ESTADO_SUGERENCIA];

interface CreateSugerenciaProrrogaProps {
  vencimientoId: string;
  estudioId: string;
  clienteId: string;
  tipoObligacion: string;
  periodo: string;
  fechaOriginal: Date;
  fechaSugerida: Date;
  motivo: string;
  reglaActivaId: string | null;
  ejecucionIngestaId: string | null;
}

const estadoSugerenciaValues = Object.values(ESTADO_SUGERENCIA) as [
  EstadoSugerencia,
  ...EstadoSugerencia[],
];

const sugerenciaProrrogaReconstituteSchema = z.object({
  vencimientoId: z.string().min(1),
  estudioId: z.string().min(1),
  clienteId: z.string().min(1),
  tipoObligacion: z.string().min(1),
  periodo: z.string().min(1),
  fechaOriginal: z.date(),
  fechaSugerida: z.date(),
  motivo: z.string().min(1),
  estado: z.enum(estadoSugerenciaValues),
  reglaActivaId: z.string().nullable(),
  ejecucionIngestaId: z.string().nullable(),
});

export type ReconstituteSugerenciaProrrogaProps = z.input<
  typeof sugerenciaProrrogaReconstituteSchema
>;

export class SugerenciaProrroga extends BaseEntity {
  private _vencimientoId!: string;
  private _estudioId!: string;
  private _clienteId!: string;
  private _tipoObligacion!: string;
  private _periodo!: string;
  private _fechaOriginal!: Date;
  private _fechaSugerida!: Date;
  private _motivo!: string;
  private _estado!: EstadoSugerencia;
  private _reglaActivaId!: string | null;
  private _ejecucionIngestaId!: string | null;

  private constructor(props: CreateSugerenciaProrrogaProps, id?: string) {
    super(id);
    if (!props.motivo || props.motivo.trim().length === 0) {
      throw new OperacionInvalidaError('El motivo de la sugerencia es obligatorio');
    }
    this._vencimientoId = props.vencimientoId;
    this._estudioId = props.estudioId;
    this._clienteId = props.clienteId;
    this._tipoObligacion = props.tipoObligacion;
    this._periodo = props.periodo;
    this._fechaOriginal = props.fechaOriginal;
    this._fechaSugerida = props.fechaSugerida;
    this._motivo = props.motivo.trim();
    this._estado = ESTADO_SUGERENCIA.ABIERTA;
    this._reglaActivaId = props.reglaActivaId;
    this._ejecucionIngestaId = props.ejecucionIngestaId;
  }

  static create(props: CreateSugerenciaProrrogaProps, id?: string): SugerenciaProrroga {
    return new SugerenciaProrroga(props, id);
  }

  static reconstitute(
    props: ReconstituteSugerenciaProrrogaProps,
    id: string,
  ): SugerenciaProrroga {
    const { instance, props: data } = reconstituteEntity(SugerenciaProrroga, {
      schema: sugerenciaProrrogaReconstituteSchema,
      props,
      id,
    });
    instance._vencimientoId = data.vencimientoId;
    instance._estudioId = data.estudioId;
    instance._clienteId = data.clienteId;
    instance._tipoObligacion = data.tipoObligacion;
    instance._periodo = data.periodo;
    instance._fechaOriginal = data.fechaOriginal;
    instance._fechaSugerida = data.fechaSugerida;
    instance._motivo = data.motivo;
    instance._estado = data.estado;
    instance._reglaActivaId = data.reglaActivaId;
    instance._ejecucionIngestaId = data.ejecucionIngestaId;
    return instance;
  }

  get vencimientoId(): string {
    return this._vencimientoId;
  }
  get estudioId(): string {
    return this._estudioId;
  }
  get clienteId(): string {
    return this._clienteId;
  }
  get tipoObligacion(): string {
    return this._tipoObligacion;
  }
  get periodo(): string {
    return this._periodo;
  }
  get fechaOriginal(): Date {
    return this._fechaOriginal;
  }
  get fechaSugerida(): Date {
    return this._fechaSugerida;
  }
  get motivo(): string {
    return this._motivo;
  }
  get estado(): EstadoSugerencia {
    return this._estado;
  }
  get reglaActivaId(): string | null {
    return this._reglaActivaId;
  }
  get ejecucionIngestaId(): string | null {
    return this._ejecucionIngestaId;
  }

  aprobar(): void {
    if (this._estado !== ESTADO_SUGERENCIA.ABIERTA) {
      throw new OperacionInvalidaError(
        'Solo se puede aprobar una sugerencia en estado ABIERTA',
      );
    }
    this._estado = ESTADO_SUGERENCIA.APROBADA;
    this.updatedAt = new Date();
  }

  descartar(): void {
    if (this._estado !== ESTADO_SUGERENCIA.ABIERTA) {
      throw new OperacionInvalidaError(
        'Solo se puede descartar una sugerencia en estado ABIERTA',
      );
    }
    this._estado = ESTADO_SUGERENCIA.DESCARTADA;
    this.updatedAt = new Date();
  }
}
