import { BaseEntity } from '../../../shared/domain';
import { Cuit } from '../value-objects/cuit.vo';
import { RazonSocial } from '../value-objects/razon-social.vo';
import type { CondicionIVA } from '@numerito/shared';

interface CreateClienteProps {
  cuit: Cuit;
  razonSocial: RazonSocial;
  condicionIva: CondicionIVA;
  tenantId: string;
}

export class Cliente extends BaseEntity {
  private _cuit: Cuit;
  private _razonSocial: RazonSocial;
  private _condicionIva: CondicionIVA;
  private _tenantId: string;
  private _isActive: boolean;
  private _responsableId?: string;

  private constructor(props: CreateClienteProps, id?: string) {
    super(id);
    this._cuit = props.cuit;
    this._razonSocial = props.razonSocial;
    this._condicionIva = props.condicionIva;
    this._tenantId = props.tenantId;
    this._isActive = true;
  }

  static create(props: CreateClienteProps, id?: string): Cliente {
    return new Cliente(props, id);
  }

  get cuit(): Cuit { return this._cuit; }
  get razonSocial(): RazonSocial { return this._razonSocial; }
  get condicionIva(): CondicionIVA { return this._condicionIva; }
  get tenantId(): string { return this._tenantId; }
  get isActive(): boolean { return this._isActive; }
  get responsableId(): string | undefined { return this._responsableId; }

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

  deactivate(): void {
    this._isActive = false;
    this.updatedAt = new Date();
  }

  activate(): void {
    this._isActive = true;
    this.updatedAt = new Date();
  }
}
