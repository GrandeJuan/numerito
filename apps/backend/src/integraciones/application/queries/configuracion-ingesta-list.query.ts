import { EntityManager } from '@mikro-orm/core';

export interface ConfiguracionIngestaItem {
  id: string;
  fuente: string;
  habilitado: boolean;
  cadenciaDias: number;
  proximaEjecucion: string | null;
  ultimaEjecucion: string | null;
  ultimoResultado: string | null;
}

export class ConfiguracionIngestaListHandler {
  constructor(private readonly em: EntityManager) {}

  async execute(): Promise<ConfiguracionIngestaItem[]> {
    const rows = await this.em
      .getConnection()
      .execute(
        `SELECT id, fuente, habilitado, cadencia_dias AS "cadenciaDias",
                proxima_ejecucion AS "proximaEjecucion",
                ultima_ejecucion AS "ultimaEjecucion",
                ultimo_resultado AS "ultimoResultado"
         FROM configuracion_ingesta ORDER BY fuente`,
      );
    return rows;
  }
}
