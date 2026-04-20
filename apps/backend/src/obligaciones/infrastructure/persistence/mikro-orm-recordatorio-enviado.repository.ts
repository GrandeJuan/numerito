import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { GlobalRepository } from '../../../shared/domain';
import type { RecordatorioEnviadoRepository } from '../../domain/repositories/recordatorio-enviado.repository';
import type { TipoRecordatorio } from '../../domain/entities/recordatorio-enviado.entity';
import { RecordatorioEnviado } from '../../domain/entities/recordatorio-enviado.entity';
import { RecordatorioEnviadoEntity } from './recordatorio-enviado.schema';
import { RecordatorioEnviadoMapper } from './recordatorio-enviado.mapper';

@Injectable()
export class MikroOrmRecordatorioEnviadoRepository
  extends GlobalRepository<RecordatorioEnviado>
  implements RecordatorioEnviadoRepository
{
  private readonly mapper = new RecordatorioEnviadoMapper();

  constructor(private readonly em: EntityManager) {
    super();
  }

  async save(entity: RecordatorioEnviado): Promise<void> {
    const data = this.mapper.toPersistence(entity);
    const existing = await this.em.findOne(RecordatorioEnviadoEntity, { id: data.id });

    if (existing) {
      existing.tipoRecordatorio = data.tipoRecordatorio;
      existing.canal = data.canal;
      existing.destinatarioId = data.destinatarioId;
      existing.fechaEnvio = data.fechaEnvio;
      existing.updatedAt = new Date();
    } else {
      this.em.create(RecordatorioEnviadoEntity, {
        id: data.id,
        vencimiento: data.vencimientoId as any,
        estudio: data.estudioId as any,
        clienteId: data.clienteId,
        tipoRecordatorio: data.tipoRecordatorio,
        canal: data.canal,
        destinatarioId: data.destinatarioId,
        fechaEnvio: data.fechaEnvio,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    await this.em.flush();
  }

  async existsForVencimiento(
    vencimientoId: string,
    tipoRecordatorio: TipoRecordatorio,
  ): Promise<boolean> {
    const count = await this.em.count(RecordatorioEnviadoEntity, {
      vencimiento: vencimientoId as any,
      tipoRecordatorio,
    });
    return count > 0;
  }

  async findByVencimientoId(vencimientoId: string): Promise<RecordatorioEnviado[]> {
    const entities = await this.em.find(
      RecordatorioEnviadoEntity,
      { vencimiento: vencimientoId as any },
      { orderBy: { fechaEnvio: 'DESC' } },
    );
    return entities.map((e) => this.mapper.toDomain(this.mapper.fromSchema(e)));
  }

  async findById(id: string): Promise<RecordatorioEnviado | null> {
    const entity = await this.em.findOne(RecordatorioEnviadoEntity, { id });
    if (!entity) return null;
    return this.mapper.toDomain(this.mapper.fromSchema(entity));
  }

  async findAll(): Promise<RecordatorioEnviado[]> {
    const entities = await this.em.find(RecordatorioEnviadoEntity, {});
    return entities.map((e) => this.mapper.toDomain(this.mapper.fromSchema(e)));
  }

  async delete(entity: RecordatorioEnviado): Promise<void> {
    const found = await this.em.findOne(RecordatorioEnviadoEntity, { id: entity.id });
    if (found) {
      this.em.remove(found);
      await this.em.flush();
    }
  }
}
