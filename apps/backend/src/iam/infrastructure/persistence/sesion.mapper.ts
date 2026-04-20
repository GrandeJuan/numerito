import { z } from 'zod';
import type { Mapper } from '../../../shared/domain';
import { Sesion } from '../../domain/entities/sesion.entity';
import type { SesionEntity } from './sesion.schema';

export const sesionPersistenceSchema = z.object({
  id: z.string().min(1),
  usuarioId: z.string().min(1),
  refreshToken: z.string().min(1),
  ipAddress: z.string(),
  userAgent: z.string(),
  expiresAt: z.date(),
  isActive: z.boolean(),
});

export type SesionPersistence = z.infer<typeof sesionPersistenceSchema>;

export class SesionMapper implements Mapper<Sesion, SesionPersistence> {
  toDomain(persistence: SesionPersistence): Sesion {
    const data = sesionPersistenceSchema.parse(persistence);
    return Sesion.reconstitute(
      {
        usuarioId: data.usuarioId,
        refreshToken: data.refreshToken,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        expiresAt: data.expiresAt,
        isActive: data.isActive,
      },
      data.id,
    );
  }

  toPersistence(domain: Sesion): SesionPersistence {
    return {
      id: domain.id,
      usuarioId: domain.usuarioId,
      refreshToken: domain.refreshToken,
      ipAddress: domain.ipAddress,
      userAgent: domain.userAgent,
      expiresAt: domain.expiresAt,
      isActive: domain.isActive,
    };
  }

  fromSchema(entity: SesionEntity): SesionPersistence {
    return {
      id: entity.id,
      usuarioId: entity.usuario.id,
      refreshToken: entity.refreshToken,
      ipAddress: entity.ipAddress,
      userAgent: entity.userAgent,
      expiresAt: entity.expiresAt,
      isActive: entity.isActive,
    };
  }
}
