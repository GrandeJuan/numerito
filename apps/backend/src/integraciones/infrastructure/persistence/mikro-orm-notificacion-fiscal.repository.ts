import { Injectable, Inject } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { NotificacionFiscalRepository } from '../../domain/repositories/notificacion-fiscal.repository';
import { NotificacionFiscal, type EstadoNotificacion } from '../../domain/entities/notificacion-fiscal.entity';
import { TenantAwareRepository } from '../../../shared/domain';
import {
  RequestContextService,
  REQUEST_CONTEXT,
} from '../../../shared/infrastructure/services/request-context.service';
import { NotificacionFiscalEntity } from './notificacion-fiscal.schema';
import { ClienteEntity } from '../../../clientes/infrastructure/persistence/cliente.schema';
import { EstudioEntity } from '../../../estudio/infrastructure/persistence/estudio.schema';
import { OrganismoFiscalEntity } from '../../../shared/infrastructure/persistence/organismo-fiscal.schema';

@Injectable()
export class MikroOrmNotificacionFiscalRepository
  extends TenantAwareRepository<NotificacionFiscal>
  implements NotificacionFiscalRepository
{
  constructor(
    @Inject(REQUEST_CONTEXT) context: RequestContextService,
    private readonly em: EntityManager,
  ) {
    super(context);
  }

  async findById(id: string): Promise<NotificacionFiscal | null> {
    const tenantId = this.getTenantId();
    const entity = await this.em.findOne(
      NotificacionFiscalEntity,
      {
        id,
        estudio: { id: tenantId },
      },
      {
        populate: ['cliente', 'estudio', 'organismo'],
      },
    );
    if (!entity) return null;
    return this.toDomain(entity);
  }

  async findByClienteId(clienteId: string): Promise<NotificacionFiscal[]> {
    const tenantId = this.getTenantId();
    const entities = await this.em.find(
      NotificacionFiscalEntity,
      {
        cliente: { id: clienteId },
        estudio: { id: tenantId },
      },
      {
        populate: ['cliente', 'estudio', 'organismo'],
      },
    );
    return entities.map((e) => this.toDomain(e));
  }

  async findAll(): Promise<NotificacionFiscal[]> {
    const tenantId = this.getTenantId();
    const entities = await this.em.find(
      NotificacionFiscalEntity,
      {
        estudio: { id: tenantId },
      },
      {
        populate: ['cliente', 'estudio', 'organismo'],
      },
    );
    return entities.map((e) => this.toDomain(e));
  }

  async save(notificacion: NotificacionFiscal): Promise<void> {
    const cliente = this.em.getReference(ClienteEntity, notificacion.clienteId);
    const estudio = this.em.getReference(EstudioEntity, notificacion.estudioId);
    const organismo = await this.em.findOneOrFail(OrganismoFiscalEntity, {
      id: Number(notificacion.organismoId),
    });

    const tenantId = this.getTenantId();
    const existing = await this.em.findOne(NotificacionFiscalEntity, { id: notificacion.id, estudio: { id: tenantId } });
    if (existing) {
      existing.cliente = cliente;
      existing.estudio = estudio;
      existing.organismo = organismo;
      existing.cuitCliente = notificacion.cuitCliente;
      existing.asunto = notificacion.asunto;
      existing.contenido = notificacion.contenido;
      existing.fechaNotificacion = notificacion.fechaNotificacion;
      existing.estado = notificacion.estado;
      existing.notaGestion = notificacion.notaGestion;
    } else {
      this.em.create(NotificacionFiscalEntity, {
        id: notificacion.id,
        cliente,
        estudio,
        organismo,
        cuitCliente: notificacion.cuitCliente,
        asunto: notificacion.asunto,
        contenido: notificacion.contenido,
        fechaNotificacion: notificacion.fechaNotificacion,
        estado: notificacion.estado,
        notaGestion: notificacion.notaGestion,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    await this.em.flush();
  }

  async delete(notificacion: NotificacionFiscal): Promise<void> {
    const tenantId = this.getTenantId();
    const entity = await this.em.findOne(NotificacionFiscalEntity, { id: notificacion.id, estudio: { id: tenantId } });
    if (entity) {
      this.em.remove(entity);
      await this.em.flush();
    }
  }

  private toDomain(entity: NotificacionFiscalEntity): NotificacionFiscal {
    return NotificacionFiscal.reconstitute(
      {
        clienteId: entity.cliente.id,
        estudioId: entity.estudio.id,
        organismoId: String(entity.organismo.id),
        cuitCliente: entity.cuitCliente,
        asunto: entity.asunto,
        contenido: entity.contenido,
        fechaNotificacion: entity.fechaNotificacion,
        estado: entity.estado as EstadoNotificacion,
        notaGestion: entity.notaGestion,
      },
      entity.id,
    );
  }
}
