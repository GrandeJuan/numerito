import { z } from 'zod';
import { BaseEntity, reconstituteEntity } from '../../../shared/domain';
import { TIPO_DOCUMENTO } from '@numerito/shared';
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

const tipoDocumentoValues = Object.values(TIPO_DOCUMENTO) as [TipoDocumento, ...TipoDocumento[]];

const documentoReconstitutePropsSchema = z.object({
  clienteId: z.string().min(1),
  estudioId: z.string().min(1),
  tipo: z.enum(tipoDocumentoValues),
  nombre: z.string(),
  s3Key: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number(),
  version: z.number(),
});

export type ReconstituteDocumentoProps = z.input<typeof documentoReconstitutePropsSchema>;

export class Documento extends BaseEntity {
  private _clienteId!: string;
  private _estudioId!: string;
  private _tipo!: TipoDocumento;
  private _nombre!: string;
  private _s3Key!: string;
  private _mimeType!: string;
  private _sizeBytes!: number;
  private _version!: number;

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
    const { instance, props: data } = reconstituteEntity(Documento, {
      schema: documentoReconstitutePropsSchema,
      props,
      id,
    });
    instance._clienteId = data.clienteId;
    instance._estudioId = data.estudioId;
    instance._tipo = data.tipo;
    instance._nombre = data.nombre;
    instance._s3Key = data.s3Key;
    instance._mimeType = data.mimeType;
    instance._sizeBytes = data.sizeBytes;
    instance._version = data.version;
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
