import { BaseEntity } from '../../../shared/domain';
import type { TipoDocumento } from '@numerito/shared';

export type { TipoDocumento };

interface CreateDocumentoProps {
  clienteId: string;
  estudioId: string;
  tipo: TipoDocumento;
  nombre: string;
  s3Key: string;
  mimeType: string;
  sizeBytes: number;
}

interface ReconstituteDocumentoProps extends CreateDocumentoProps {
  version: number;
}

export class Documento extends BaseEntity {
  private _clienteId: string;
  private _estudioId: string;
  private _tipo: TipoDocumento;
  private _nombre: string;
  private _s3Key: string;
  private _mimeType: string;
  private _sizeBytes: number;
  private _version: number;

  private constructor(props: CreateDocumentoProps, id?: string) {
    super(id);
    this._clienteId = props.clienteId;
    this._estudioId = props.estudioId;
    this._tipo = props.tipo;
    this._nombre = props.nombre;
    this._s3Key = props.s3Key;
    this._mimeType = props.mimeType;
    this._sizeBytes = props.sizeBytes;
    this._version = 1;
  }

  static create(props: CreateDocumentoProps, id?: string): Documento {
    return new Documento(props, id);
  }

  static reconstitute(props: ReconstituteDocumentoProps, id: string): Documento {
    const instance = Object.create(Documento.prototype) as Documento;
    Object.defineProperty(instance, 'id', { value: id, writable: false, enumerable: true });
    Object.defineProperty(instance, 'createdAt', { value: new Date(), writable: false, enumerable: true });
    instance.updatedAt = new Date();
    Object.defineProperty(instance, '_domainEvents', { value: [], writable: true, enumerable: false });
    instance._clienteId = props.clienteId;
    instance._estudioId = props.estudioId;
    instance._tipo = props.tipo;
    instance._nombre = props.nombre;
    instance._s3Key = props.s3Key;
    instance._mimeType = props.mimeType;
    instance._sizeBytes = props.sizeBytes;
    instance._version = props.version;
    return instance;
  }

  get clienteId(): string { return this._clienteId; }
  get estudioId(): string { return this._estudioId; }
  get tipo(): TipoDocumento { return this._tipo; }
  get nombre(): string { return this._nombre; }
  get s3Key(): string { return this._s3Key; }
  get mimeType(): string { return this._mimeType; }
  get sizeBytes(): number { return this._sizeBytes; }
  get version(): number { return this._version; }

  newVersion(s3Key: string, sizeBytes: number): void {
    this._s3Key = s3Key;
    this._sizeBytes = sizeBytes;
    this._version++;
    this.updatedAt = new Date();
  }
}
