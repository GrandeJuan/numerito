import { z } from 'zod';
import { ROL } from '@numerito/shared';
import type { Rol } from '@numerito/shared';
import type { Mapper } from '../../../shared/domain';
import { UsuarioEstudio } from '../../domain/entities/usuario-estudio.entity';
import type { UsuarioEstudioEntity } from './usuario-estudio.schema';

const rolValues = Object.values(ROL) as [Rol, ...Rol[]];

export const usuarioEstudioPersistenceSchema = z.object({
  id: z.string().uuid(),
  usuarioId: z.string().min(1),
  estudioId: z.string().min(1),
  rol: z.enum(rolValues),
  isActive: z.boolean(),
});

export type UsuarioEstudioPersistence = z.infer<typeof usuarioEstudioPersistenceSchema>;

export class UsuarioEstudioMapper implements Mapper<UsuarioEstudio, UsuarioEstudioPersistence> {
  toDomain(persistence: UsuarioEstudioPersistence): UsuarioEstudio {
    const data = usuarioEstudioPersistenceSchema.parse(persistence);
    return UsuarioEstudio.reconstitute(
      {
        usuarioId: data.usuarioId,
        estudioId: data.estudioId,
        rol: data.rol,
        isActive: data.isActive,
      },
      data.id,
    );
  }

  toPersistence(domain: UsuarioEstudio): UsuarioEstudioPersistence {
    return {
      id: domain.id,
      usuarioId: domain.usuarioId,
      estudioId: domain.estudioId,
      rol: domain.rol,
      isActive: domain.isActive,
    };
  }

  fromSchema(entity: UsuarioEstudioEntity): UsuarioEstudioPersistence {
    return {
      id: entity.id,
      usuarioId: entity.usuario.id,
      estudioId: entity.estudio.id,
      rol: entity.rol.codigo as Rol,
      isActive: entity.isActive,
    };
  }
}
