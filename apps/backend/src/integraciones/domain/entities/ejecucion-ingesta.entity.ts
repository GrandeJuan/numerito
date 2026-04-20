import { z } from 'zod';
import { BaseEntity, reconstituteEntity } from '../../../shared/domain';
import type { FuenteIngesta } from './configuracion-ingesta.entity';
import { FUENTE_INGESTA } from './configuracion-ingesta.entity';

const FUENTES = Object.values(FUENTE_INGESTA) as [string, ...string[]];

export const ESTADO_EJECUCION = {
  EN_CURSO: 'EN_CURSO',
  EXITOSA: 'EXITOSA',
  FALLIDA: 'FALLIDA',
} as const;
export type EstadoEjecucion = (typeof ESTADO_EJECUCION)[keyof typeof ESTADO_EJECUCION];

export const DISPARADOR_INGESTA = {
  MANUAL: 'MANUAL',
  SCHEDULE: 'SCHEDULE',
} as const;
export type DisparadorIngesta = (typeof DISPARADOR_INGESTA)[keyof typeof DISPARADOR_INGESTA];

interface CreateEjecucionIngestaProps {
  fuente: FuenteIngesta;
  disparador: DisparadorIngesta;
  disparadoPor?: string | null;
}

const reconstituteSchema = z.object({
  fuente: z.enum(FUENTES),
  estado: z.enum(['EN_CURSO', 'EXITOSA', 'FALLIDA']),
  disparador: z.enum(['MANUAL', 'SCHEDULE']),
  disparadoPor: z.string().nullable(),
  inicio: z.date(),
  fin: z.date().nullable(),
  reglasNuevas: z.number().int().min(0),
  reglasModificadas: z.number().int().min(0),
  errores: z.array(z.string()),
});

export type ReconstituteEjecucionIngestaProps = z.input<typeof reconstituteSchema>;

export class EjecucionIngesta extends BaseEntity {
  private _fuente!: FuenteIngesta;
  private _estado!: EstadoEjecucion;
  private _disparador!: DisparadorIngesta;
  private _disparadoPor!: string | null;
  private _inicio!: Date;
  private _fin!: Date | null;
  private _reglasNuevas!: number;
  private _reglasModificadas!: number;
  private _errores!: string[];

  private constructor(props: CreateEjecucionIngestaProps, id?: string) {
    super(id);
    this._fuente = props.fuente;
    this._estado = ESTADO_EJECUCION.EN_CURSO;
    this._disparador = props.disparador;
    this._disparadoPor = props.disparadoPor ?? null;
    this._inicio = new Date();
    this._fin = null;
    this._reglasNuevas = 0;
    this._reglasModificadas = 0;
    this._errores = [];
  }

  static create(props: CreateEjecucionIngestaProps, id?: string): EjecucionIngesta {
    return new EjecucionIngesta(props, id);
  }

  static reconstitute(props: ReconstituteEjecucionIngestaProps, id: string): EjecucionIngesta {
    const { instance, props: data } = reconstituteEntity(EjecucionIngesta, {
      schema: reconstituteSchema,
      props,
      id,
    });
    instance._fuente = data.fuente as FuenteIngesta;
    instance._estado = data.estado as EstadoEjecucion;
    instance._disparador = data.disparador as DisparadorIngesta;
    instance._disparadoPor = data.disparadoPor;
    instance._inicio = data.inicio;
    instance._fin = data.fin;
    instance._reglasNuevas = data.reglasNuevas;
    instance._reglasModificadas = data.reglasModificadas;
    instance._errores = data.errores;
    return instance;
  }

  get fuente(): FuenteIngesta { return this._fuente; }
  get estado(): EstadoEjecucion { return this._estado; }
  get disparador(): DisparadorIngesta { return this._disparador; }
  get disparadoPor(): string | null { return this._disparadoPor; }
  get inicio(): Date { return this._inicio; }
  get fin(): Date | null { return this._fin; }
  get reglasNuevas(): number { return this._reglasNuevas; }
  get reglasModificadas(): number { return this._reglasModificadas; }
  get errores(): string[] { return [...this._errores]; }

  completarExitosa(reglasNuevas: number, reglasModificadas: number): void {
    this._estado = ESTADO_EJECUCION.EXITOSA;
    this._fin = new Date();
    this._reglasNuevas = reglasNuevas;
    this._reglasModificadas = reglasModificadas;
    this.updatedAt = new Date();
  }

  completarFallida(errores: string[]): void {
    this._estado = ESTADO_EJECUCION.FALLIDA;
    this._fin = new Date();
    this._errores = errores;
    this.updatedAt = new Date();
  }

  agregarError(error: string): void {
    this._errores.push(error);
  }
}
