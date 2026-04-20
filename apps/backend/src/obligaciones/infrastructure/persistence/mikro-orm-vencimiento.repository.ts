import { Injectable, Inject } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';
import type { VencimientoRepository } from '../../domain/repositories/vencimiento.repository';
import { Vencimiento, type EstadoVencimiento } from '../../domain/entities/vencimiento.entity';
import { TenantAwareRepository } from '../../../shared/domain';
import {
  RequestContextService,
  REQUEST_CONTEXT,
} from '../../../shared/infrastructure/services/request-context.service';
import { VencimientoEntity } from './vencimiento.schema';
import { TipoObligacionEntity } from '../../../shared/infrastructure/persistence/tipo-obligacion.schema';
import { EstadoVencimientoEntity } from '../../../shared/infrastructure/persistence/estado-vencimiento.schema';
import { ClienteEntity } from '../../../clientes/infrastructure/persistence/cliente.schema';
import { EstudioEntity } from '../../../estudio/infrastructure/persistence/estudio.schema';
import { UsuarioEntity } from '../../../iam/infrastructure/persistence/usuario.schema';
import { VencimientoMapper } from './vencimiento.mapper';

@Injectable()
export class MikroOrmVencimientoRepository
  extends TenantAwareRepository<Vencimiento>
  implements VencimientoRepository
{
  private readonly mapper = new VencimientoMapper();

  constructor(
    @Inject(REQUEST_CONTEXT) context: RequestContextService,
    private readonly em: EntityManager,
  ) {
    super(context);
  }

  async findById(principal: EstudioPrincipal, id: string): Promise<Vencimiento | null> {
    const entity = await this.em.findOne(
      VencimientoEntity,
      {
        id,
        estudio: { id: principal.estudioId },
      },
      {
        populate: ['tipoObligacion', 'estado', 'cliente', 'estudio', 'responsable'],
      },
    );
    if (!entity) return null;
    return this.mapper.toDomain(this.mapper.fromSchema(entity));
  }

  async findByClienteId(principal: EstudioPrincipal, clienteId: string): Promise<Vencimiento[]> {
    const entities = await this.em.find(
      VencimientoEntity,
      {
        cliente: { id: clienteId },
        estudio: { id: principal.estudioId },
      },
      {
        populate: ['tipoObligacion', 'estado', 'cliente', 'estudio', 'responsable'],
      },
    );
    return entities.map((e) => this.mapper.toDomain(this.mapper.fromSchema(e)));
  }

  async findByPeriodo(principal: EstudioPrincipal, periodo: string): Promise<Vencimiento[]> {
    const entities = await this.em.find(
      VencimientoEntity,
      {
        periodo,
        estudio: { id: principal.estudioId },
      },
      {
        populate: ['tipoObligacion', 'estado', 'cliente', 'estudio', 'responsable'],
      },
    );
    return entities.map((e) => this.mapper.toDomain(this.mapper.fromSchema(e)));
  }

  async findByEstado(principal: EstudioPrincipal, estado: EstadoVencimiento): Promise<Vencimiento[]> {
    const entities = await this.em.find(
      VencimientoEntity,
      {
        estado: { codigo: estado },
        estudio: { id: principal.estudioId },
      },
      {
        populate: ['tipoObligacion', 'estado', 'cliente', 'estudio', 'responsable'],
      },
    );
    return entities.map((e) => this.mapper.toDomain(this.mapper.fromSchema(e)));
  }

  async findProximosAVencer(principal: EstudioPrincipal, diasAnticipacion: number): Promise<Vencimiento[]> {
    const now = new Date();
    const limit = new Date();
    limit.setDate(limit.getDate() + diasAnticipacion);

    const entities = await this.em.find(
      VencimientoEntity,
      {
        estudio: { id: principal.estudioId },
        estado: { codigo: 'PENDIENTE' },
        fechaVencimiento: { $gte: now, $lte: limit },
      },
      {
        populate: ['tipoObligacion', 'estado', 'cliente', 'estudio', 'responsable'],
      },
    );
    return entities.map((e) => this.mapper.toDomain(this.mapper.fromSchema(e)));
  }

  async findByClienteAndPeriodo(principal: EstudioPrincipal, clienteId: string, periodo: string): Promise<Vencimiento[]> {
    const entities = await this.em.find(
      VencimientoEntity,
      {
        cliente: { id: clienteId },
        periodo,
        estudio: { id: principal.estudioId },
      },
      {
        populate: ['tipoObligacion', 'estado', 'cliente', 'estudio', 'responsable'],
      },
    );
    return entities.map((e) => this.mapper.toDomain(this.mapper.fromSchema(e)));
  }

  async findAll(principal: EstudioPrincipal): Promise<Vencimiento[]> {
    const entities = await this.em.find(
      VencimientoEntity,
      {
        estudio: { id: principal.estudioId },
      },
      {
        populate: ['tipoObligacion', 'estado', 'cliente', 'estudio', 'responsable'],
      },
    );
    return entities.map((e) => this.mapper.toDomain(this.mapper.fromSchema(e)));
  }

  async save(principal: EstudioPrincipal, vencimiento: Vencimiento): Promise<void> {
    const data = this.mapper.toPersistence(vencimiento);
    const [tipoObligacion, estado] = await Promise.all([
      this.em.findOneOrFail(TipoObligacionEntity, { codigo: data.tipoObligacion }),
      this.em.findOneOrFail(EstadoVencimientoEntity, { codigo: data.estado }),
    ]);
    const cliente = this.em.getReference(ClienteEntity, data.clienteId);
    const estudio = this.em.getReference(EstudioEntity, data.estudioId);

    const existing = await this.em.findOne(VencimientoEntity, { id: data.id, estudio: { id: principal.estudioId } });
    const responsable = data.responsableId
      ? this.em.getReference(UsuarioEntity, data.responsableId)
      : undefined;

    if (existing) {
      existing.cliente = cliente;
      existing.estudio = estudio;
      existing.tipoObligacion = tipoObligacion;
      existing.periodo = data.periodo;
      existing.fechaVencimiento = data.fechaVencimiento;
      existing.fechaNominal = data.fechaNominal;
      existing.descripcion = data.descripcion;
      existing.estado = estado;
      existing.motivo = data.motivo;
      existing.fechaProrrogada = data.fechaProrrogada;
      existing.responsable = responsable;
    } else {
      this.em.create(VencimientoEntity, {
        id: data.id,
        cliente,
        estudio,
        tipoObligacion,
        periodo: data.periodo,
        fechaVencimiento: data.fechaVencimiento,
        fechaNominal: data.fechaNominal,
        descripcion: data.descripcion,
        estado,
        motivo: data.motivo,
        fechaProrrogada: data.fechaProrrogada,
        responsable,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    await this.em.flush();
  }

  async delete(principal: EstudioPrincipal, vencimiento: Vencimiento): Promise<void> {
    const entity = await this.em.findOne(VencimientoEntity, { id: vencimiento.id, estudio: { id: principal.estudioId } });
    if (entity) {
      this.em.remove(entity);
      await this.em.flush();
    }
  }
}
