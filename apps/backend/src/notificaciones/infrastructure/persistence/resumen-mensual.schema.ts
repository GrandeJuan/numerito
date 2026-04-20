import { EntitySchema } from '@mikro-orm/core';

export class ResumenMensualEntity {
  id!: string;
  estudioId!: string;
  clienteId!: string;
  clienteNombre!: string;
  periodo!: string;
  totalVencimientos!: number;
  estado!: string;
  pdfBuffer!: Buffer | null;
  emailEnviado!: boolean;
  errorMensaje!: string | null;
  createdAt!: Date;
  updatedAt!: Date;
}

export const ResumenMensualSchema = new EntitySchema<ResumenMensualEntity>({
  class: ResumenMensualEntity,
  tableName: 'resumen_mensual',
  properties: {
    id: { type: 'uuid', primary: true },
    estudioId: { type: 'uuid', fieldName: 'estudio_id', index: true },
    clienteId: { type: 'uuid', fieldName: 'cliente_id', index: true },
    clienteNombre: { type: 'string', fieldName: 'cliente_nombre', length: 255 },
    periodo: { type: 'string', length: 7 },
    totalVencimientos: { type: 'integer', fieldName: 'total_vencimientos' },
    estado: { type: 'string', length: 20 },
    pdfBuffer: { type: 'blob', fieldName: 'pdf_buffer', nullable: true },
    emailEnviado: { type: 'boolean', fieldName: 'email_enviado', default: false },
    errorMensaje: { type: 'string', fieldName: 'error_mensaje', length: 1000, nullable: true },
    createdAt: { type: 'Date', fieldName: 'created_at', onCreate: () => new Date() },
    updatedAt: { type: 'Date', fieldName: 'updated_at', onCreate: () => new Date(), onUpdate: () => new Date() },
  },
  uniques: [
    { properties: ['estudioId', 'clienteId', 'periodo'] },
  ],
});
