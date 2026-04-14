import { BaseEntity } from '../../../shared/domain';
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

interface ReconstituteLibroContableProps extends CreateLibroContableProps {
  isRubricado: boolean;
  numeroRubrica?: string;
}

export class LibroContable extends BaseEntity {
  private _clienteId: string;
  private _estudioId: string;
  private _tipo: TipoLibro;
  private _periodo: string;
  private _isRubricado: boolean;
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
    const instance = Object.create(LibroContable.prototype) as LibroContable;
    Object.defineProperty(instance, 'id', { value: id, writable: false, enumerable: true });
    Object.defineProperty(instance, 'createdAt', { value: new Date(), writable: false, enumerable: true });
    instance.updatedAt = new Date();
    Object.defineProperty(instance, '_domainEvents', { value: [], writable: true, enumerable: false });
    instance._clienteId = props.clienteId;
    instance._estudioId = props.estudioId;
    instance._tipo = props.tipo;
    instance._periodo = props.periodo;
    instance._isRubricado = props.isRubricado;
    instance._numeroRubrica = props.numeroRubrica;
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
