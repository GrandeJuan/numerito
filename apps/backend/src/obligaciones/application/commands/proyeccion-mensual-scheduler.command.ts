import { Logger } from '@nestjs/common';
import type { EstudioRepository } from '../../../estudio/domain/repositories/estudio.repository';
import type { ProyectarCalendarioMasivoHandler, ProyectarCalendarioMasivoResult } from './proyectar-calendario-masivo.command';
import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';

export interface ProyeccionMensualResult {
  periodo: string;
  estudiosActivos: number;
  estudiosOmitidos: number;
  resultadosPorEstudio: {
    estudioId: string;
    estudioNombre: string;
    clientesProcesados: number;
    totalProyectados: number;
    errores: number;
  }[];
  erroresPorEstudio: {
    estudioId: string;
    estudioNombre: string;
    error: string;
  }[];
}

/**
 * System-level scheduler that iterates all active estudios and triggers
 * batch calendar projection for each. Designed to be called monthly
 * (day 1) via an admin endpoint triggered by EventBridge Scheduler.
 *
 * Constructs system-level EstudioPrincipal per estudio — no HTTP
 * request context required.
 */
export class ProyeccionMensualScheduler {
  private readonly logger = new Logger(ProyeccionMensualScheduler.name);

  constructor(
    private readonly estudioRepo: EstudioRepository,
    private readonly proyectarMasivoHandler: ProyectarCalendarioMasivoHandler,
  ) {}

  async execute(periodo?: string): Promise<ProyeccionMensualResult> {
    const targetPeriodo = periodo ?? this.currentPeriodo();
    this.logger.log(`Starting monthly projection for periodo=${targetPeriodo}`);

    const estudios = await this.estudioRepo.findAll();
    const activeEstudios = estudios.filter((e) => e.isActive);

    let estudiosOmitidos = 0;
    const resultadosPorEstudio: ProyeccionMensualResult['resultadosPorEstudio'] = [];
    const erroresPorEstudio: ProyeccionMensualResult['erroresPorEstudio'] = [];

    for (const estudio of activeEstudios) {
      const systemPrincipal: EstudioPrincipal = {
        estudioId: estudio.id,
        userId: 'system',
        roles: ['SUPERADMIN'],
      };

      try {
        const result: ProyectarCalendarioMasivoResult =
          await this.proyectarMasivoHandler.execute(systemPrincipal, {
            periodo: targetPeriodo,
          });

        if (result.clientesProcesados === 0 && result.clientesOmitidos > 0) {
          estudiosOmitidos++;
          continue;
        }

        resultadosPorEstudio.push({
          estudioId: estudio.id,
          estudioNombre: estudio.nombre.value,
          clientesProcesados: result.clientesProcesados,
          totalProyectados: result.totalProyectados,
          errores: result.errores.length,
        });

        if (result.errores.length > 0) {
          this.logger.warn(
            `Estudio ${estudio.nombre.value}: ${result.errores.length} client error(s)`,
          );
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        erroresPorEstudio.push({
          estudioId: estudio.id,
          estudioNombre: estudio.nombre.value,
          error: msg,
        });
        this.logger.error(
          `Failed projection for estudio=${estudio.nombre.value}: ${msg}`,
        );
      }
    }

    const totalProyectados = resultadosPorEstudio.reduce(
      (sum, r) => sum + r.totalProyectados,
      0,
    );

    this.logger.log(
      `Monthly projection complete: ${resultadosPorEstudio.length} estudios processed, ` +
        `${totalProyectados} vencimientos projected, ${erroresPorEstudio.length} studio errors`,
    );

    return {
      periodo: targetPeriodo,
      estudiosActivos: activeEstudios.length,
      estudiosOmitidos,
      resultadosPorEstudio,
      erroresPorEstudio,
    };
  }

  private currentPeriodo(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }
}
