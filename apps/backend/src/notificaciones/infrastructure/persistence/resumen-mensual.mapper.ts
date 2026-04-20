import { z } from 'zod';
import type { Mapper } from '../../../shared/domain';
import { ResumenMensual, EstadoResumen } from '../../domain/entities/resumen-mensual.entity';
import type { ResumenMensualEntity } from './resumen-mensual.schema';

const estadoValues = Object.values(EstadoResumen) as [EstadoResumen, ...EstadoResumen[]];

export const resumenMensualPersistenceSchema = z.object({
  id: z.string().min(1),
  estudioId: z.string().min(1),
  clienteId: z.string().min(1),
  clienteNombre: z.string().min(1),
  periodo: z.string().regex(/^\d{4}-\d{2}$/),
  totalVencimientos: z.number().int().nonnegative(),
  estado: z.enum(estadoValues),
  pdfBuffer: z.instanceof(Buffer).nullable(),
  emailEnviado: z.boolean(),
  errorMensaje: z.string().nullable(),
});

export type ResumenMensualPersistence = z.infer<typeof resumenMensualPersistenceSchema>;

export class ResumenMensualMapper implements Mapper<ResumenMensual, ResumenMensualPersistence> {
  toDomain(persistence: ResumenMensualPersistence): ResumenMensual {
    const data = resumenMensualPersistenceSchema.parse(persistence);
    return ResumenMensual.reconstitute(
      {
        estudioId: data.estudioId,
        clienteId: data.clienteId,
        clienteNombre: data.clienteNombre,
        periodo: data.periodo,
        totalVencimientos: data.totalVencimientos,
        estado: data.estado,
        pdfBuffer: data.pdfBuffer,
        emailEnviado: data.emailEnviado,
        errorMensaje: data.errorMensaje,
      },
      data.id,
    );
  }

  toPersistence(domain: ResumenMensual): ResumenMensualPersistence {
    return {
      id: domain.id,
      estudioId: domain.estudioId,
      clienteId: domain.clienteId,
      clienteNombre: domain.clienteNombre,
      periodo: domain.periodo,
      totalVencimientos: domain.totalVencimientos,
      estado: domain.estado,
      pdfBuffer: domain.pdfBuffer,
      emailEnviado: domain.emailEnviado,
      errorMensaje: domain.errorMensaje,
    };
  }

  fromSchema(entity: ResumenMensualEntity): ResumenMensualPersistence {
    return {
      id: entity.id,
      estudioId: entity.estudioId,
      clienteId: entity.clienteId,
      clienteNombre: entity.clienteNombre,
      periodo: entity.periodo,
      totalVencimientos: entity.totalVencimientos,
      estado: entity.estado as EstadoResumen,
      pdfBuffer: entity.pdfBuffer,
      emailEnviado: entity.emailEnviado,
      errorMensaje: entity.errorMensaje,
    };
  }
}
