import { EntityManager } from '@mikro-orm/core';

export interface CatalogoObligacionItem {
  id: string;
  nombre: string;
  tipoObligacion: string;
  jurisdiccion: string;
  frecuencia: string;
  activo: boolean;
}

export class CatalogoObligacionListHandler {
  constructor(private readonly em: EntityManager) {}

  async execute(): Promise<CatalogoObligacionItem[]> {
    const rows = await this.em
      .getConnection()
      .execute(
        `SELECT id, nombre, tipo_obligacion AS "tipoObligacion", jurisdiccion, frecuencia, activo
         FROM catalogo_obligacion ORDER BY jurisdiccion, nombre`,
      );
    return rows;
  }
}
