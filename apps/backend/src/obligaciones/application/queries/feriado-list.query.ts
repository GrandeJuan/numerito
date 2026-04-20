import { EntityManager } from '@mikro-orm/core';
import { DiaFeriadoEntity } from '../../infrastructure/persistence/dia-feriado.schema';

export interface FeriadoListFilters {
  anio?: number;
  tipo?: string;
}

export interface FeriadoListItem {
  id: string;
  fecha: string;
  tipo: string;
  descripcion: string;
  jurisdiccionAfectada: string | null;
}

export class FeriadoListHandler {
  constructor(private readonly em: EntityManager) {}

  async execute(filters: FeriadoListFilters = {}): Promise<FeriadoListItem[]> {
    const where: Record<string, unknown> = {};

    if (filters.tipo) {
      where.tipo = filters.tipo;
    }

    if (filters.anio) {
      const desde = new Date(`${filters.anio}-01-01`);
      const hasta = new Date(`${filters.anio}-12-31`);
      where.fecha = { $gte: desde, $lte: hasta };
    }

    const entities = await this.em.find(DiaFeriadoEntity, where, {
      orderBy: { fecha: 'ASC' },
    });

    return entities.map((e) => ({
      id: e.id,
      fecha: e.fecha.toISOString().slice(0, 10),
      tipo: e.tipo,
      descripcion: e.descripcion,
      jurisdiccionAfectada: e.jurisdiccionAfectada,
    }));
  }
}
