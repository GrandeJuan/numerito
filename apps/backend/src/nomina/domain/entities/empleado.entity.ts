import { BaseEntity } from '../../../shared/domain';
import { OperacionInvalidaError } from '../../../shared/domain/exceptions';

interface CreateEmpleadoProps {
  clienteId: string;
  estudioId: string;
  nombre: string;
  apellido: string;
  cuil: string;
  fechaIngreso: Date;
  sueldoBasico: number;
  categoriaConvenio: string;
}

interface ReconstituteEmpleadoProps extends CreateEmpleadoProps {
  isActive: boolean;
  fechaEgreso?: Date;
}

export class Empleado extends BaseEntity {
  private _clienteId: string;
  private _estudioId: string;
  private _nombre: string;
  private _apellido: string;
  private _cuil: string;
  private _fechaIngreso: Date;
  private _fechaEgreso?: Date;
  private _sueldoBasico: number;
  private _categoriaConvenio: string;
  private _isActive: boolean;

  private constructor(props: CreateEmpleadoProps, id?: string) {
    super(id);
    if (props.sueldoBasico <= 0) {
      throw new OperacionInvalidaError('El sueldo debe ser mayor a 0');
    }
    if (props.fechaIngreso > new Date()) {
      throw new OperacionInvalidaError('La fecha de ingreso no puede ser futura');
    }
    this._clienteId = props.clienteId;
    this._estudioId = props.estudioId;
    this._nombre = props.nombre;
    this._apellido = props.apellido;
    this._cuil = props.cuil;
    this._fechaIngreso = props.fechaIngreso;
    this._sueldoBasico = props.sueldoBasico;
    this._categoriaConvenio = props.categoriaConvenio;
    this._isActive = true;
  }

  static create(props: CreateEmpleadoProps, id?: string): Empleado {
    return new Empleado(props, id);
  }

  static reconstitute(props: ReconstituteEmpleadoProps, id: string): Empleado {
    const instance = Object.create(Empleado.prototype) as Empleado;
    Object.defineProperty(instance, 'id', { value: id, writable: false, enumerable: true });
    Object.defineProperty(instance, 'createdAt', { value: new Date(), writable: false, enumerable: true });
    instance.updatedAt = new Date();
    Object.defineProperty(instance, '_domainEvents', { value: [], writable: true, enumerable: false });
    instance._clienteId = props.clienteId;
    instance._estudioId = props.estudioId;
    instance._nombre = props.nombre;
    instance._apellido = props.apellido;
    instance._cuil = props.cuil;
    instance._fechaIngreso = props.fechaIngreso;
    instance._fechaEgreso = props.fechaEgreso;
    instance._sueldoBasico = props.sueldoBasico;
    instance._categoriaConvenio = props.categoriaConvenio;
    instance._isActive = props.isActive;
    return instance;
  }

  get clienteId(): string { return this._clienteId; }
  get estudioId(): string { return this._estudioId; }
  get nombre(): string { return this._nombre; }
  get apellido(): string { return this._apellido; }
  get cuil(): string { return this._cuil; }
  get fechaIngreso(): Date { return this._fechaIngreso; }
  get fechaEgreso(): Date | undefined { return this._fechaEgreso; }
  get sueldoBasico(): number { return this._sueldoBasico; }
  get categoriaConvenio(): string { return this._categoriaConvenio; }
  get isActive(): boolean { return this._isActive; }

  get antiguedadAnios(): number {
    const now = new Date();
    return Math.floor((now.getTime() - this._fechaIngreso.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  }

  actualizar(props: { nombre?: string; apellido?: string; categoriaConvenio?: string }): void {
    if (props.nombre) this._nombre = props.nombre;
    if (props.apellido) this._apellido = props.apellido;
    if (props.categoriaConvenio) this._categoriaConvenio = props.categoriaConvenio;
    this.updatedAt = new Date();
  }

  actualizarSueldo(nuevoSueldo: number): void {
    if (nuevoSueldo <= 0) {
      throw new OperacionInvalidaError('El sueldo debe ser mayor a 0');
    }
    this._sueldoBasico = nuevoSueldo;
    this.updatedAt = new Date();
  }

  darDeBaja(fechaEgreso: Date): void {
    this._isActive = false;
    this._fechaEgreso = fechaEgreso;
    this.updatedAt = new Date();
  }
}
