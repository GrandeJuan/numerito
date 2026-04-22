import { Injectable, Inject } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';
import type { SugerenciaProrrogaRepository } from '../../domain/repositories/sugerencia-prorroga.repository';
import {
  SugerenciaProrroga,
  type EstadoSugerencia,
  ESTADO_SUGERENCIA,
} from '../../domain/entities/sugerencia-prorroga.entity';
import { TenantAwareRepository } from '../../../shared/domain';
import {
  RequestContextService,
  REQUEST_CONTEXT,
} from '../../../shared/infrastructure/services/request-context.service';
import { SugerenciaProrrogaEntity } from './sugerencia-prorroga.schema';
import { VencimientoEntity } from './vencimiento.schema';
import { EstudioEntity } from '../../../estudio/infrastructure/persistence/estudio.schema';
import { SugerenciaProrrogaMapper } from './sugerencia-prorroga.mapper';

@Injectable()
export class MikroOrmSugerenciaProrrogaRepository
  extends TenantAwareRepository<SugerenciaProrroga>
  implements SugerenciaProrrogaRepository
{
  private readonly mapper = new SugerenciaProrrogaMapper();

  constructor(
    @Inject(REQUEST_CONTEXT) context: RequestContextService,
    private readonly em: EntityManager,
  ) {
    super(context);
  }

  async findById(principal: EstudioPrincipal, id: string): Promise<SugerenciaProrroga | null> {
    const entity = await this.em.findOne(
      SugerenciaProrrogaEntity,
      { id, estudio: { id: principal.estudioId } },
      { populate: ['vencimiento', 'estudio'] },
    );
    if (!entity) return null;
    return this.mapper.toDomain(this.mapper.fromSchema(entity));
  }

  async findByVencimientoId(
    principal: EstudioPrincipal,
    vencimientoId: string,
  ): Promise<SugerenciaProrroga[]> {
    const entities = await this.em.find(
      SugerenciaProrrogaEntity,
      { vencimiento: { id: vencimientoId }, estudio: { id: principal.estudioId } },
      { populate: ['vencimiento', 'estudio'] },
    );
    return entities.map((e) => this.mapper.toDomain(this.mapper.fromSchema(e)));
  }

  async findByEstado(
    principal: EstudioPrincipal,
    estado: EstadoSugerencia,
  ): Promise<SugerenciaProrroga[]> {
    const entities = await this.em.find(
      SugerenciaProrrogaEntity,
      { estado, estudio: { id: principal.estudioId } },
      { populate: ['vencimiento', 'estudio'], orderBy: { createdAt: 'ASC' } },
    );
    return entities.map((e) => this.mapper.toDomain(this.mapper.fromSchema(e)));
  }

  async findAbiertas(principal: EstudioPrincipal): Promise<SugerenciaProrroga[]> {
    return this.findByEstado(principal, ESTADO_SUGERENCIA.ABIERTA);
  }

  async save(principal: EstudioPrincipal, sugerencia: SugerenciaProrroga): Promise<void> {
    const data = this.mapper.toPersistence(sugerencia);
    const vencimiento = this.em.getReference(VencimientoEntity, data.vencimientoId);
    const estudio = this.em.getReference(EstudioEntity, data.estudioId);

    const existing = await this.em.findOne(SugerenciaProrrogaEntity, {
      id: data.id,
      estudio: { id: principal.estudioId },
    });

    if (existing) {
      existing.estado = data.estado;
      existing.updatedAt = new Date();
    } else {
      this.em.create(SugerenciaProrrogaEntity, {
        id: data.id,
        vencimiento,
        estudio,
        clienteId: data.clienteId,
        tipoObligacion: data.tipoObligacion,
        periodo: data.periodo,
        fechaOriginal: data.fechaOriginal,
        fechaSugerida: data.fechaSugerida,
        motivo: data.motivo,
        estado: data.estado,
        reglaActivaId: data.reglaActivaId,
        ejecucionIngestaId: data.ejecucionIngestaId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    await this.em.flush();
  }

  async saveManyGlobal(sugerencias: SugerenciaProrroga[]): Promise<void> {
    if (sugerencias.length === 0) return;
    for (const sugerencia of sugerencias) {
      const data = this.mapper.toPersistence(sugerencia);
      this.em.create(SugerenciaProrrogaEntity, {
        id: data.id,
        vencimiento: this.em.getReference(VencimientoEntity, data.vencimientoId),
        estudio: this.em.getReference(EstudioEntity, data.estudioId),
        clienteId: data.clienteId,
        tipoObligacion: data.tipoObligacion,
        periodo: data.periodo,
        fechaOriginal: data.fechaOriginal,
        fechaSugerida: data.fechaSugerida,
        motivo: data.motivo,
        estado: data.estado,
        reglaActivaId: data.reglaActivaId,
        ejecucionIngestaId: data.ejecucionIngestaId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    await this.em.flush();
  }

  async delete(principal: EstudioPrincipal, sugerencia: SugerenciaProrroga): Promise<void> {
    const entity = await this.em.findOne(SugerenciaProrrogaEntity, {
      id: sugerencia.id,
      estudio: { id: principal.estudioId },
    });
    if (entity) {
      this.em.remove(entity);
      await this.em.flush();
    }
  }
}
