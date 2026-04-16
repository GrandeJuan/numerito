import { z } from 'zod';
import {
  CONDICION_IVA,
  REGIMEN,
  TIPO_CLIENTE,
  type CondicionIVA,
  type Regimen,
  type TipoCliente,
} from '@numerito/shared';
import type { Mapper } from '../../../shared/domain';
import { Cliente } from '../../domain/entities/cliente.entity';
import { Cuit } from '../../domain/value-objects/cuit.vo';
import { RazonSocial } from '../../domain/value-objects/razon-social.vo';
import type { ClienteEntity } from './cliente.schema';

const condicionIvaValues = Object.values(CONDICION_IVA) as [CondicionIVA, ...CondicionIVA[]];
const tipoClienteValues = Object.values(TIPO_CLIENTE) as [TipoCliente, ...TipoCliente[]];
const regimenValues = Object.values(REGIMEN) as [Regimen, ...Regimen[]];

export const clientePersistenceSchema = z.object({
  id: z.string().uuid(),
  cuit: z.string().min(1),
  razonSocial: z.string().min(1),
  condicionIva: z.enum(condicionIvaValues),
  tipo: z.enum(tipoClienteValues),
  regimen: z.enum(regimenValues),
  estudioId: z.string().min(1),
  responsableId: z.string().min(1).optional(),
  isActive: z.boolean(),
});

export type ClientePersistence = z.infer<typeof clientePersistenceSchema>;

export class ClienteMapper implements Mapper<Cliente, ClientePersistence> {
  toDomain(persistence: ClientePersistence): Cliente {
    const data = clientePersistenceSchema.parse(persistence);
    return Cliente.reconstitute(
      {
        cuit: Cuit.create(data.cuit),
        razonSocial: RazonSocial.create(data.razonSocial),
        condicionIva: data.condicionIva,
        tipo: data.tipo,
        regimen: data.regimen,
        estudioId: data.estudioId,
        isActive: data.isActive,
        responsableId: data.responsableId,
      },
      data.id,
    );
  }

  toPersistence(domain: Cliente): ClientePersistence {
    return {
      id: domain.id,
      cuit: domain.cuit.raw,
      razonSocial: domain.razonSocial.value,
      condicionIva: domain.condicionIva,
      tipo: domain.tipo,
      regimen: domain.regimen,
      estudioId: domain.estudioId,
      responsableId: domain.responsableId,
      isActive: domain.isActive,
    };
  }

  fromSchema(entity: ClienteEntity): ClientePersistence {
    return {
      id: entity.id,
      cuit: entity.cuit,
      razonSocial: entity.razonSocial,
      condicionIva: entity.condicionIva.codigo as CondicionIVA,
      tipo: entity.tipoCliente.codigo as TipoCliente,
      regimen: entity.regimen.codigo as Regimen,
      estudioId: entity.estudio.id,
      responsableId: entity.responsable?.id,
      isActive: entity.isActive,
    };
  }
}
