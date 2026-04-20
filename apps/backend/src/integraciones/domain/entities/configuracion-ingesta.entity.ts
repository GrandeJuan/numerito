import { z } from 'zod';
import { BaseEntity, reconstituteEntity } from '../../../shared/domain';

const FUENTES_INGESTA = ['ARCA', 'ARBA', 'AGIP', 'BCRA_FERIADOS'] as const;
export type FuenteIngesta = (typeof FUENTES_INGESTA)[number];
export const FUENTE_INGESTA = Object.freeze(
  Object.fromEntries(FUENTES_INGESTA.map((f) => [f, f])) as Record<FuenteIngesta, FuenteIngesta>,
);

interface CreateConfiguracionIngestaProps {
  fuente: FuenteIngesta;
  habilitado?: boolean;
  cadenciaDias: number;
}

const reconstituteSchema = z.object({
  fuente: z.enum(FUENTES_INGESTA),
  habilitado: z.boolean(),
  cadenciaDias: z.number().int().min(1),
  proximaEjecucion: z.date().nullable(),
  ultimaEjecucion: z.date().nullable(),
  ultimoResultado: z.string().nullable(),
});

export type ReconstituteConfiguracionIngestaProps = z.input<typeof reconstituteSchema>;

export class ConfiguracionIngesta extends BaseEntity {
  private _fuente!: FuenteIngesta;
  private _habilitado!: boolean;
  private _cadenciaDias!: number;
  private _proximaEjecucion!: Date | null;
  private _ultimaEjecucion!: Date | null;
  private _ultimoResultado!: string | null;

  private constructor(props: CreateConfiguracionIngestaProps, id?: string) {
    super(id);
    this._fuente = props.fuente;
    this._habilitado = props.habilitado ?? false;
    this._cadenciaDias = props.cadenciaDias;
    this._proximaEjecucion = null;
    this._ultimaEjecucion = null;
    this._ultimoResultado = null;
  }

  static create(props: CreateConfiguracionIngestaProps, id?: string): ConfiguracionIngesta {
    if (props.cadenciaDias < 1) {
      throw new Error('cadenciaDias debe ser >= 1');
    }
    return new ConfiguracionIngesta(props, id);
  }

  static reconstitute(
    props: ReconstituteConfiguracionIngestaProps,
    id: string,
  ): ConfiguracionIngesta {
    const { instance, props: data } = reconstituteEntity(ConfiguracionIngesta, {
      schema: reconstituteSchema,
      props,
      id,
    });
    instance._fuente = data.fuente;
    instance._habilitado = data.habilitado;
    instance._cadenciaDias = data.cadenciaDias;
    instance._proximaEjecucion = data.proximaEjecucion;
    instance._ultimaEjecucion = data.ultimaEjecucion;
    instance._ultimoResultado = data.ultimoResultado;
    return instance;
  }

  get fuente(): FuenteIngesta {
    return this._fuente;
  }
  get habilitado(): boolean {
    return this._habilitado;
  }
  get cadenciaDias(): number {
    return this._cadenciaDias;
  }
  get proximaEjecucion(): Date | null {
    return this._proximaEjecucion;
  }
  get ultimaEjecucion(): Date | null {
    return this._ultimaEjecucion;
  }
  get ultimoResultado(): string | null {
    return this._ultimoResultado;
  }

  habilitar(): void {
    this._habilitado = true;
    this.updatedAt = new Date();
  }

  deshabilitar(): void {
    this._habilitado = false;
    this._proximaEjecucion = null;
    this.updatedAt = new Date();
  }

  actualizarCadencia(cadenciaDias: number): void {
    if (cadenciaDias < 1) {
      throw new Error('cadenciaDias debe ser >= 1');
    }
    this._cadenciaDias = cadenciaDias;
    this.updatedAt = new Date();
  }

  registrarEjecucion(resultado: string): void {
    this._ultimaEjecucion = new Date();
    this._ultimoResultado = resultado;
    if (this._habilitado) {
      this._proximaEjecucion = new Date(
        this._ultimaEjecucion.getTime() + this._cadenciaDias * 24 * 60 * 60 * 1000,
      );
    }
    this.updatedAt = new Date();
  }

  actualizar(props: { habilitado?: boolean; cadenciaDias?: number }): void {
    if (props.habilitado !== undefined) {
      if (props.habilitado) {
        this.habilitar();
      } else {
        this.deshabilitar();
      }
    }
    if (props.cadenciaDias !== undefined) {
      this.actualizarCadencia(props.cadenciaDias);
    }
  }
}
