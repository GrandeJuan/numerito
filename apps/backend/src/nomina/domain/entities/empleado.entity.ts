import { BaseEntity } from '../../../shared/domain';
import { OperacionInvalidaError } from '../../../shared/domain/exceptions';

interface CreateEmpleadoProps {
  clienteId: string;
  tenantId: string;
  nombre: string;
  apellido: string;
  cuil: string;
  fechaIngreso: Date;
  sueldoBasico: number;
  categoriaConvenio: string;
}

export class Empleado extends BaseEntity {
  private _clienteId: string;
  private _tenantId: string;
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
    this._clienteId = props.clienteId;
    this._tenantId = props.tenantId;
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

  get clienteId(): string { return this._clienteId; }
  get tenantId(): string { return this._tenantId; }
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
