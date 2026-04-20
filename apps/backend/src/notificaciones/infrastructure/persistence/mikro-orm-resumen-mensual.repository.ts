import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { ResumenMensualRepository } from '../../domain/repositories/resumen-mensual.repository';
import { ResumenMensual } from '../../domain/entities/resumen-mensual.entity';
import { ResumenMensualEntity } from './resumen-mensual.schema';
import { ResumenMensualMapper } from './resumen-mensual.mapper';

@Injectable()
export class MikroOrmResumenMensualRepository implements ResumenMensualRepository {
  private readonly mapper = new ResumenMensualMapper();

  constructor(private readonly em: EntityManager) {}

  async findById(id: string): Promise<ResumenMensual | null> {
    const entity = await this.em.findOne(ResumenMensualEntity, { id });
    if (!entity) return null;
    return this.mapper.toDomain(this.mapper.fromSchema(entity));
  }

  async findByClienteAndPeriodo(
    estudioId: string,
    clienteId: string,
    periodo: string,
  ): Promise<ResumenMensual | null> {
    const entity = await this.em.findOne(ResumenMensualEntity, {
      estudioId,
      clienteId,
      periodo,
    });
    if (!entity) return null;
    return this.mapper.toDomain(this.mapper.fromSchema(entity));
  }

  async findByEstudioAndPeriodo(
    estudioId: string,
    periodo: string,
  ): Promise<ResumenMensual[]> {
    const entities = await this.em.find(
      ResumenMensualEntity,
      { estudioId, periodo },
      { orderBy: { clienteNombre: 'ASC' } },
    );
    return entities.map((e) => this.mapper.toDomain(this.mapper.fromSchema(e)));
  }

  async findByClienteRecientes(
    clienteId: string,
    limit: number,
  ): Promise<ResumenMensual[]> {
    const entities = await this.em.find(
      ResumenMensualEntity,
      { clienteId },
      { orderBy: { createdAt: 'DESC' }, limit },
    );
    return entities.map((e) => this.mapper.toDomain(this.mapper.fromSchema(e)));
  }

  async save(resumen: ResumenMensual): Promise<void> {
    const existing = await this.em.findOne(ResumenMensualEntity, { id: resumen.id });
    if (existing) {
      existing.estado = resumen.estado;
      existing.pdfBuffer = resumen.pdfBuffer;
      existing.emailEnviado = resumen.emailEnviado;
      existing.errorMensaje = resumen.errorMensaje;
      existing.totalVencimientos = resumen.totalVencimientos;
    } else {
      this.em.create(ResumenMensualEntity, {
        id: resumen.id,
        estudioId: resumen.estudioId,
        clienteId: resumen.clienteId,
        clienteNombre: resumen.clienteNombre,
        periodo: resumen.periodo,
        totalVencimientos: resumen.totalVencimientos,
        estado: resumen.estado,
        pdfBuffer: resumen.pdfBuffer,
        emailEnviado: resumen.emailEnviado,
        errorMensaje: resumen.errorMensaje,
        createdAt: resumen.createdAt,
        updatedAt: resumen.updatedAt,
      });
    }
    await this.em.flush();
  }
}
