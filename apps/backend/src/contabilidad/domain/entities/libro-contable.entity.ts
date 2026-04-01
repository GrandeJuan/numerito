import { BaseEntity } from '../../../shared/domain';

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
  tenantId: string;
  tipo: TipoLibro;
  periodo: string;
}

export class LibroContable extends BaseEntity {
  private _clienteId: string;
  private _tenantId: string;
  private _tipo: TipoLibro;
  private _periodo: string;
  private _isRubricado: boolean;
  private _numeroRubrica?: string;

  private constructor(props: CreateLibroContableProps, id?: string) {
    super(id);
    this._clienteId = props.clienteId;
    this._tenantId = props.tenantId;
    this._tipo = props.tipo;
    this._periodo = props.periodo;
    this._isRubricado = false;
  }

  static create(props: CreateLibroContableProps, id?: string): LibroContable {
    return new LibroContable(props, id);
  }

  get clienteId(): string { return this._clienteId; }
  get tenantId(): string { return this._tenantId; }
  get tipo(): TipoLibro { return this._tipo; }
  get periodo(): string { return this._periodo; }
  get isRubricado(): boolean { return this._isRubricado; }
  get numeroRubrica(): string | undefined { return this._numeroRubrica; }

  rubricar(numeroRubrica: string): void {
    if (this._isRubricado) {
      throw new Error('El libro ya está rubricado');
    }
    this._isRubricado = true;
    this._numeroRubrica = numeroRubrica;
    this.updatedAt = new Date();
  }
}
