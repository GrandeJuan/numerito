import { z } from 'zod';
import { BaseEntity, reconstituteEntity } from '../../../shared/domain';
import { OperacionInvalidaError } from '../../../shared/domain/exceptions';

export const TIPO_LIBRO = {
  IVA_COMPRAS: 'IVA_COMPRAS',
  IVA_VENTAS: 'IVA_VENTAS',
  SUELDOS: 'SUELDOS',
  DIARIO: 'DIARIO',
  INVENTARIO_BALANCES: 'INVENTARIO_BALANCES',
} as const;

export type TipoLibro = (typeof TIPO_LIBRO)[keyof typeof TIPO_LIBRO];

interface CreateLibroContableProps {
  clienteId: string;
  estudioId: string;
  tipo: TipoLibro;
  periodo: string;
}

const tipoLibroValues = Object.values(TIPO_LIBRO) as [TipoLibro, ...TipoLibro[]];

const libroContableReconstitutePropsSchema = z.object({
  clienteId: z.string().min(1),
  estudioId: z.string().min(1),
  tipo: z.enum(tipoLibroValues),
  periodo: z.string().min(1),
  isRubricado: z.boolean(),
  numeroRubrica: z.string().optional(),
});

export type ReconstituteLibroContableProps = z.input<typeof libroContableReconstitutePropsSchema>;

export class LibroContable extends BaseEntity {
  private _clienteId!: string;
  private _estudioId!: string;
  private _tipo!: TipoLibro;
  private _periodo!: string;
  private _isRubricado!: boolean;
  private _numeroRubrica?: string;

  private constructor(props: CreateLibroContableProps, id?: string) {
    super(id);
    this._clienteId = props.clienteId;
    this._estudioId = props.estudioId;
    this._tipo = props.tipo;
    this._periodo = props.periodo;
    this._isRubricado = false;
  }

  static create(props: CreateLibroContableProps, id?: string): LibroContable {
    return new LibroContable(props, id);
  }

  static reconstitute(props: ReconstituteLibroContableProps, id: string): LibroContable {
    const { instance, props: data } = reconstituteEntity(LibroContable, {
      schema: libroContableReconstitutePropsSchema,
      props,
      id,
    });
    instance._clienteId = data.clienteId;
    instance._estudioId = data.estudioId;
    instance._tipo = data.tipo;
    instance._periodo = data.periodo;
    instance._isRubricado = data.isRubricado;
    instance._numeroRubrica = data.numeroRubrica;
    return instance;
  }

  get clienteId(): string { return this._clienteId; }
  get estudioId(): string { return this._estudioId; }
  get tipo(): TipoLibro { return this._tipo; }
  get periodo(): string { return this._periodo; }
  get isRubricado(): boolean { return this._isRubricado; }
  get numeroRubrica(): string | undefined { return this._numeroRubrica; }

  rubricar(numeroRubrica: string): void {
    if (this._isRubricado) {
      throw new OperacionInvalidaError('El libro ya está rubricado');
    }
    this._isRubricado = true;
    this._numeroRubrica = numeroRubrica;
    this.updatedAt = new Date();
  }
}
