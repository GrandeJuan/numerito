import { z } from 'zod';
import type { Mapper } from '../../../shared/domain';
import {
  LibroContable,
  TIPO_LIBRO,
  type TipoLibro,
} from '../../domain/entities/libro-contable.entity';
import type { LibroContableEntity } from './libro-contable.schema';

const tipoLibroValues = Object.values(TIPO_LIBRO) as [TipoLibro, ...TipoLibro[]];

export const libroContablePersistenceSchema = z.object({
  id: z.string().uuid(),
  clienteId: z.string().min(1),
  estudioId: z.string().min(1),
  tipo: z.enum(tipoLibroValues),
  periodo: z.string().min(1),
  isRubricado: z.boolean(),
  numeroRubrica: z.string().optional(),
});

export type LibroContablePersistence = z.infer<
  typeof libroContablePersistenceSchema
>;

export class LibroContableMapper
  implements Mapper<LibroContable, LibroContablePersistence>
{
  toDomain(persistence: LibroContablePersistence): LibroContable {
    const data = libroContablePersistenceSchema.parse(persistence);
    return LibroContable.reconstitute(
      {
        clienteId: data.clienteId,
        estudioId: data.estudioId,
        tipo: data.tipo,
        periodo: data.periodo,
        isRubricado: data.isRubricado,
        numeroRubrica: data.numeroRubrica,
      },
      data.id,
    );
  }

  toPersistence(domain: LibroContable): LibroContablePersistence {
    return {
      id: domain.id,
      clienteId: domain.clienteId,
      estudioId: domain.estudioId,
      tipo: domain.tipo,
      periodo: domain.periodo,
      isRubricado: domain.isRubricado,
      numeroRubrica: domain.numeroRubrica,
    };
  }

  fromSchema(entity: LibroContableEntity): LibroContablePersistence {
    return {
      id: entity.id,
      clienteId: entity.cliente.id,
      estudioId: entity.estudio.id,
      tipo: entity.tipoLibro.codigo as TipoLibro,
      periodo: entity.periodo,
      isRubricado: entity.isRubricado,
      numeroRubrica: entity.numeroRubrica,
    };
  }
}
