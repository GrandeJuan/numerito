import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { GlobalRepository } from '../../../shared/domain';
import type { ReglaVencimientoEntityRepository } from '../../domain/repositories/regla-vencimiento.repository';
import { ReglaVencimiento } from '../../domain/entities/regla-vencimiento.entity';
import { ReglaVencimientoEntity } from './regla-vencimiento.schema';
import { TipoObligacionEntity } from '../../../shared/infrastructure/persistence/tipo-obligacion.schema';
import { ReglaVencimientoMapper } from './regla-vencimiento.mapper';
import type { TipoObligacion, Jurisdiccion, EstadoRegla } from '@numerito/shared';
import { ESTADO_REGLA } from '@numerito/shared';

@Injectable()
export class MikroOrmReglaVencimientoRepository
  extends GlobalRepository<ReglaVencimiento>
  implements ReglaVencimientoEntityRepository
{
  private readonly mapper = new ReglaVencimientoMapper();

  constructor(private readonly em: EntityManager) {
    super();
  }

  async findById(id: string): Promise<ReglaVencimiento | null> {
    const entity = await this.em.findOne(
      ReglaVencimientoEntity,
      { id: Number(id) },
      { populate: ['tipoObligacion'] },
    );
    if (!entity) return null;
    return this.mapper.toDomain(this.mapper.fromSchema(entity));
  }

  async findAll(): Promise<ReglaVencimiento[]> {
    const entities = await this.em.find(
      ReglaVencimientoEntity,
      {},
      { populate: ['tipoObligacion'] },
    );
    return entities.map((e) => this.mapper.toDomain(this.mapper.fromSchema(e)));
  }

  async findActivas(): Promise<ReglaVencimiento[]> {
    const entities = await this.em.find(
      ReglaVencimientoEntity,
      { estado: ESTADO_REGLA.ACTIVA },
      { populate: ['tipoObligacion'] },
    );
    return entities.map((e) => this.mapper.toDomain(this.mapper.fromSchema(e)));
  }

  async findByEstado(estado: EstadoRegla): Promise<ReglaVencimiento[]> {
    const entities = await this.em.find(
      ReglaVencimientoEntity,
      { estado },
      { populate: ['tipoObligacion'] },
    );
    return entities.map((e) => this.mapper.toDomain(this.mapper.fromSchema(e)));
  }

  async findVigentes(
    tipoObligacion: TipoObligacion,
    jurisdiccion: Jurisdiccion,
    regimen: string,
    terminacion: string,
    fecha: Date,
  ): Promise<ReglaVencimiento[]> {
    const entities = await this.em.find(
      ReglaVencimientoEntity,
      {
        tipoObligacion: { codigo: tipoObligacion },
        jurisdiccion,
        regimen,
        terminacionCuit: terminacion,
        estado: ESTADO_REGLA.ACTIVA,
        vigenciaDesde: { $lte: fecha },
        $or: [
          { vigenciaHasta: null },
          { vigenciaHasta: { $gte: fecha } },
        ],
      },
      { populate: ['tipoObligacion'] },
    );
    return entities.map((e) => this.mapper.toDomain(this.mapper.fromSchema(e)));
  }

  async save(regla: ReglaVencimiento): Promise<void> {
    const data = this.mapper.toPersistence(regla);
    const numericId = Number(data.id);
    const tipoObligacion = await this.em.findOneOrFail(TipoObligacionEntity, {
      codigo: data.tipoObligacion,
    });

    if (!isNaN(numericId) && numericId > 0) {
      const existing = await this.em.findOne(ReglaVencimientoEntity, { id: numericId });
      if (existing) {
        existing.tipoObligacion = tipoObligacion;
        existing.jurisdiccion = data.jurisdiccion;
        existing.regimen = data.regimen;
        existing.terminacionCuit = data.terminacionCuit;
        existing.diaVencimiento = data.diaVencimiento;
        existing.mesSiguiente = data.mesSiguiente;
        existing.vigenciaDesde = data.vigenciaDesde;
        existing.vigenciaHasta = data.vigenciaHasta;
        existing.origen = data.origen;
        existing.estado = data.estado;
        await this.em.flush();
        return;
      }
    }

    // New entity — let DB assign autoincrement ID
    this.em.create(ReglaVencimientoEntity, {
      tipoObligacion,
      jurisdiccion: data.jurisdiccion,
      regimen: data.regimen,
      terminacionCuit: data.terminacionCuit,
      diaVencimiento: data.diaVencimiento,
      mesSiguiente: data.mesSiguiente,
      vigenciaDesde: data.vigenciaDesde,
      vigenciaHasta: data.vigenciaHasta,
      origen: data.origen,
      estado: data.estado,
    });
    await this.em.flush();
  }

  async delete(regla: ReglaVencimiento): Promise<void> {
    const numericId = Number(regla.id);
    if (isNaN(numericId)) return;
    const entity = await this.em.findOne(ReglaVencimientoEntity, { id: numericId });
    if (entity) {
      this.em.remove(entity);
      await this.em.flush();
    }
  }
}
