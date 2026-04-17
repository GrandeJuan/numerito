import { z } from 'zod';
import type { Mapper } from '../../../shared/domain';
import type { CredencialFiscalData } from '../../domain/repositories/credencial-fiscal.repository';
import type { CredencialFiscalEntity } from './credencial-fiscal.schema';

export const credencialFiscalPersistenceSchema = z.object({
  id: z.string().uuid(),
  clienteId: z.string().min(1),
  estudioId: z.string().min(1),
  organismoId: z.string(),
  cuit: z.string(),
  secretArn: z.string(),
  ultimaSincronizacion: z.date().optional(),
  estado: z.string(),
});

export type CredencialFiscalPersistence = z.infer<typeof credencialFiscalPersistenceSchema>;

export class CredencialFiscalMapper implements Mapper<CredencialFiscalData, CredencialFiscalPersistence> {
  toDomain(persistence: CredencialFiscalPersistence): CredencialFiscalData {
    const data = credencialFiscalPersistenceSchema.parse(persistence);
    return {
      id: data.id,
      clienteId: data.clienteId,
      estudioId: data.estudioId,
      organismoId: data.organismoId,
      cuit: data.cuit,
      secretArn: data.secretArn,
      ultimaSincronizacion: data.ultimaSincronizacion,
      estado: data.estado,
    };
  }

  toPersistence(domain: CredencialFiscalData): CredencialFiscalPersistence {
    return {
      id: domain.id,
      clienteId: domain.clienteId,
      estudioId: domain.estudioId,
      organismoId: domain.organismoId,
      cuit: domain.cuit,
      secretArn: domain.secretArn,
      ultimaSincronizacion: domain.ultimaSincronizacion,
      estado: domain.estado,
    };
  }

  fromSchema(entity: CredencialFiscalEntity): CredencialFiscalPersistence {
    return {
      id: entity.id,
      clienteId: entity.cliente.id,
      estudioId: entity.estudio.id,
      organismoId: String(entity.organismo.id),
      cuit: entity.cuit,
      secretArn: entity.secretArn,
      ultimaSincronizacion: entity.ultimaSincronizacion,
      estado: entity.estado,
    };
  }
}
