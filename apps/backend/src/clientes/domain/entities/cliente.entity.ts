import { BaseEntity } from '../../../shared/domain';
import { Cuit } from '../value-objects/cuit.vo';
import { RazonSocial } from '../value-objects/razon-social.vo';
import type { CondicionIVA, Provincia, TipoCliente, Regimen } from '@numerito/shared';

export type { TipoCliente, Regimen };

interface CreateClienteProps {
  cuit: Cuit;
  razonSocial: RazonSocial;
  condicionIva: CondicionIVA;
  tipo: TipoCliente;
  regimen: Regimen;
  estudioId: string;
  provincias?: Provincia[];
}

export class Cliente extends BaseEntity {
  private _cuit: Cuit;
  private _razonSocial: RazonSocial;
  private _condicionIva: CondicionIVA;
  private _tipo: TipoCliente;
  private _regimen: Regimen;
  private _estudioId: string;
  private _isActive: boolean;
  private _responsableId?: string;
  private _provincias: Provincia[];

  private constructor(props: CreateClienteProps, id?: string) {
    super(id);
    this._cuit = props.cuit;
    this._razonSocial = props.razonSocial;
    this._condicionIva = props.condicionIva;
    this._tipo = props.tipo;
    this._regimen = props.regimen;
    this._estudioId = props.estudioId;
    this._isActive = true;
    this._provincias = props.provincias ?? [];
  }

  static create(props: CreateClienteProps, id?: string): Cliente {
    return new Cliente(props, id);
  }

  get cuit(): Cuit { return this._cuit; }
  get razonSocial(): RazonSocial { return this._razonSocial; }
  get condicionIva(): CondicionIVA { return this._condicionIva; }
  get tipo(): TipoCliente { return this._tipo; }
  get regimen(): Regimen { return this._regimen; }
  get estudioId(): string { return this._estudioId; }
  get isActive(): boolean { return this._isActive; }
  get responsableId(): string | undefined { return this._responsableId; }
  get provincias(): Provincia[] { return [...this._provincias]; }

  changeCondicionIva(condicion: CondicionIVA): void {
    this._condicionIva = condicion;
    this.updatedAt = new Date();
  }

  updateRazonSocial(razonSocial: RazonSocial): void {
    this._razonSocial = razonSocial;
    this.updatedAt = new Date();
  }

  assignResponsable(responsableId: string): void {
    this._responsableId = responsableId;
    this.updatedAt = new Date();
  }

  changeRegimen(regimen: Regimen): void {
    this._regimen = regimen;
    this.updatedAt = new Date();
  }

  addProvincia(provincia: Provincia): void {
    if (!this._provincias.includes(provincia)) {
      this._provincias.push(provincia);
      this.updatedAt = new Date();
    }
  }

  removeProvincia(provincia: Provincia): void {
    this._provincias = this._provincias.filter(p => p !== provincia);
    this.updatedAt = new Date();
  }

  deactivate(): void {
    this._isActive = false;
    this.updatedAt = new Date();
  }

  activate(): void {
    this._isActive = true;
    this.updatedAt = new Date();
  }
}
