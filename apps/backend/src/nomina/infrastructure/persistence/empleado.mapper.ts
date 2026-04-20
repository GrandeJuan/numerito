import { z } from 'zod';
import type { Mapper } from '../../../shared/domain';
import { Empleado } from '../../domain/entities/empleado.entity';
import type { EmpleadoEntity } from './empleado.schema';

export const empleadoPersistenceSchema = z.object({
  id: z.string().min(1),
  clienteId: z.string().min(1),
  estudioId: z.string().min(1),
  nombre: z.string(),
  apellido: z.string(),
  cuil: z.string(),
  fechaIngreso: z.date(),
  fechaEgreso: z.date().optional(),
  sueldoBasico: z.number(),
  categoriaConvenio: z.string(),
  isActive: z.boolean(),
});

export type EmpleadoPersistence = z.infer<typeof empleadoPersistenceSchema>;

export class EmpleadoMapper implements Mapper<Empleado, EmpleadoPersistence> {
  toDomain(persistence: EmpleadoPersistence): Empleado {
    const data = empleadoPersistenceSchema.parse(persistence);
    return Empleado.reconstitute(
      {
        clienteId: data.clienteId,
        estudioId: data.estudioId,
        nombre: data.nombre,
        apellido: data.apellido,
        cuil: data.cuil,
        fechaIngreso: data.fechaIngreso,
        fechaEgreso: data.fechaEgreso,
        sueldoBasico: data.sueldoBasico,
        categoriaConvenio: data.categoriaConvenio,
        isActive: data.isActive,
      },
      data.id,
    );
  }

  toPersistence(domain: Empleado): EmpleadoPersistence {
    return {
      id: domain.id,
      clienteId: domain.clienteId,
      estudioId: domain.estudioId,
      nombre: domain.nombre,
      apellido: domain.apellido,
      cuil: domain.cuil,
      fechaIngreso: domain.fechaIngreso,
      fechaEgreso: domain.fechaEgreso,
      sueldoBasico: domain.sueldoBasico,
      categoriaConvenio: domain.categoriaConvenio,
      isActive: domain.isActive,
    };
  }

  fromSchema(entity: EmpleadoEntity): EmpleadoPersistence {
    return {
      id: entity.id,
      clienteId: entity.cliente.id,
      estudioId: entity.estudio.id,
      nombre: entity.nombre,
      apellido: entity.apellido,
      cuil: entity.cuil,
      fechaIngreso: entity.fechaIngreso,
      fechaEgreso: entity.fechaEgreso,
      sueldoBasico: entity.sueldoBasico,
      categoriaConvenio: entity.categoriaConvenio,
      isActive: entity.isActive,
    };
  }
}
