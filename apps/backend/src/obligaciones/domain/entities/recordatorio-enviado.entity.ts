import { z } from 'zod';
import { BaseEntity, reconstituteEntity } from '../../../shared/domain';

export const TIPO_RECORDATORIO = {
  ANTICIPACION: 'ANTICIPACION',
  EN_RIESGO: 'EN_RIESGO',
} as const;

export type TipoRecordatorio = (typeof TIPO_RECORDATORIO)[keyof typeof TIPO_RECORDATORIO];

export const CANAL_RECORDATORIO = {
  EMAIL: 'EMAIL',
  INTERNAL: 'INTERNAL',
} as const;

export type CanalRecordatorio = (typeof CANAL_RECORDATORIO)[keyof typeof CANAL_RECORDATORIO];

interface CreateRecordatorioEnviadoProps {
  vencimientoId: string;
  estudioId: string;
  clienteId: string;
  tipoRecordatorio: TipoRecordatorio;
  canal: CanalRecordatorio;
  destinatarioId: string;
}

const tipoRecordatorioValues = Object.values(TIPO_RECORDATORIO) as [TipoRecordatorio, ...TipoRecordatorio[]];
const canalRecordatorioValues = Object.values(CANAL_RECORDATORIO) as [CanalRecordatorio, ...CanalRecordatorio[]];

const recordatorioEnviadoReconstituteSchema = z.object({
  vencimientoId: z.string().min(1),
  estudioId: z.string().min(1),
  clienteId: z.string().min(1),
  tipoRecordatorio: z.enum(tipoRecordatorioValues),
  canal: z.enum(canalRecordatorioValues),
  destinatarioId: z.string().min(1),
  fechaEnvio: z.date(),
});

export type ReconstituteRecordatorioEnviadoProps = z.input<typeof recordatorioEnviadoReconstituteSchema>;

export class RecordatorioEnviado extends BaseEntity {
  private _vencimientoId!: string;
  private _estudioId!: string;
  private _clienteId!: string;
  private _tipoRecordatorio!: TipoRecordatorio;
  private _canal!: CanalRecordatorio;
  private _destinatarioId!: string;
  private _fechaEnvio!: Date;

  private constructor(props: CreateRecordatorioEnviadoProps, id?: string) {
    super(id);
    this._vencimientoId = props.vencimientoId;
    this._estudioId = props.estudioId;
    this._clienteId = props.clienteId;
    this._tipoRecordatorio = props.tipoRecordatorio;
    this._canal = props.canal;
    this._destinatarioId = props.destinatarioId;
    this._fechaEnvio = new Date();
  }

  static create(props: CreateRecordatorioEnviadoProps, id?: string): RecordatorioEnviado {
    return new RecordatorioEnviado(props, id);
  }

  static reconstitute(props: ReconstituteRecordatorioEnviadoProps, id: string): RecordatorioEnviado {
    const { instance, props: data } = reconstituteEntity(RecordatorioEnviado, {
      schema: recordatorioEnviadoReconstituteSchema,
      props,
      id,
    });
    instance._vencimientoId = data.vencimientoId;
    instance._estudioId = data.estudioId;
    instance._clienteId = data.clienteId;
    instance._tipoRecordatorio = data.tipoRecordatorio;
    instance._canal = data.canal;
    instance._destinatarioId = data.destinatarioId;
    instance._fechaEnvio = data.fechaEnvio;
    return instance;
  }

  get vencimientoId(): string { return this._vencimientoId; }
  get estudioId(): string { return this._estudioId; }
  get clienteId(): string { return this._clienteId; }
  get tipoRecordatorio(): TipoRecordatorio { return this._tipoRecordatorio; }
  get canal(): CanalRecordatorio { return this._canal; }
  get destinatarioId(): string { return this._destinatarioId; }
  get fechaEnvio(): Date { return this._fechaEnvio; }
}
