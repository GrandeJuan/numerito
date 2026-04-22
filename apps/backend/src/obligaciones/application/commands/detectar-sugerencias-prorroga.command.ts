import { EntityManager } from '@mikro-orm/postgresql';
import { SugerenciaProrroga } from '../../domain/entities/sugerencia-prorroga.entity';
import type { AjusteDiaHabilService } from '../../domain/services/ajuste-dia-habil.service';
import type { SugerenciaProrrogaRepository } from '../../domain/repositories/sugerencia-prorroga.repository';

/**
 * Local mirror of the `DiffRegla` payload produced by the ingesta handler.
 * Kept as a primitives-only DTO here so obligaciones does not reach into
 * integraciones' application layer (cross-context coupling). The shape must
 * stay in lockstep with `ProcesarResultadoScrapingHandler`'s diff emission.
 */
export interface DiffReglaInput {
  tipo: 'NUEVA' | 'MODIFICADA' | 'SIN_CAMBIOS';
  propuesta: {
    tipoObligacion: string;
    diaVencimiento: number;
    mesSiguiente: boolean;
    jurisdiccion: string;
  };
  cambios?: string[];
  reglaActivaId?: string | null;
}

export interface DetectarSugerenciasProrrogaCommand {
  reglasModificadas: DiffReglaInput[];
  ejecucionIngestaId: string | null;
}

export interface DetectarSugerenciasProrrogaResult {
  sugerenciasCreadas: number;
  sugerenciasOmitidas: number;
}

interface VencimientoRow {
  id: string;
  estudio_id: string;
  cliente_id: string;
  tipo_obligacion: string;
  periodo: string;
  fecha_vencimiento: Date;
}

/**
 * Global handler (no EstudioPrincipal) — scraping rule changes are global
 * and affect vencimientos across all tenants. Creates per-tenant sugerencias
 * via the repository's cross-tenant batch insert.
 */
export class DetectarSugerenciasProrrogaHandler {
  constructor(
    private readonly em: EntityManager,
    private readonly ajusteDiaHabil: AjusteDiaHabilService,
    private readonly sugerenciaRepo: SugerenciaProrrogaRepository,
  ) {}

  async execute(
    command: DetectarSugerenciasProrrogaCommand,
  ): Promise<DetectarSugerenciasProrrogaResult> {
    const { reglasModificadas, ejecucionIngestaId } = command;

    let sugerenciasCreadas = 0;
    let sugerenciasOmitidas = 0;

    const tiposAfectados = reglasModificadas
      .filter((d) => d.tipo === 'MODIFICADA')
      .map((d) => d.propuesta.tipoObligacion);

    if (tiposAfectados.length === 0) {
      return { sugerenciasCreadas: 0, sugerenciasOmitidas: 0 };
    }

    const conn = this.em.getConnection();
    const placeholders = tiposAfectados.map((_, i) => `$${i + 1}`).join(', ');
    const pendientes = await conn.execute<VencimientoRow[]>(
      `SELECT v.id, v.estudio_id, v.cliente_id, t.codigo AS tipo_obligacion, v.periodo, v.fecha_vencimiento
       FROM vencimiento v
       JOIN tipo_obligacion t ON t.id = v.tipo_obligacion_id
       JOIN estado_vencimiento e ON e.id = v.estado_id
       WHERE e.codigo = 'PENDIENTE'
         AND t.codigo IN (${placeholders})`,
      tiposAfectados,
    );

    const existingOpen = await conn.execute<{ vencimiento_id: string }[]>(
      `SELECT vencimiento_id FROM sugerencia_prorroga WHERE estado = 'ABIERTA'`,
    );
    const openSet = new Set(existingOpen.map((r) => r.vencimiento_id));

    const nuevas: SugerenciaProrroga[] = [];

    for (const diff of reglasModificadas) {
      if (diff.tipo !== 'MODIFICADA') continue;
      const { propuesta } = diff;

      const matching = pendientes.filter((v) => v.tipo_obligacion === propuesta.tipoObligacion);

      for (const venc of matching) {
        if (openSet.has(venc.id)) {
          sugerenciasOmitidas++;
          continue;
        }

        const [yearStr, monthStr] = venc.periodo.split('-');
        const year = Number(yearStr);
        const month = Number(monthStr) - 1;
        const targetMonth = propuesta.mesSiguiente ? month + 1 : month;
        const targetYear = targetMonth > 11 ? year + 1 : year;
        const normalizedMonth = targetMonth % 12;
        const fechaNominal = new Date(targetYear, normalizedMonth, propuesta.diaVencimiento);

        const fechaSugerida = await this.ajusteDiaHabil.ajustar(
          fechaNominal,
          propuesta.jurisdiccion,
        );

        const currentDateStr = new Date(venc.fecha_vencimiento).toISOString().slice(0, 10);
        const suggestedDateStr = fechaSugerida.toISOString().slice(0, 10);
        if (currentDateStr === suggestedDateStr) {
          sugerenciasOmitidas++;
          continue;
        }

        const motivo =
          (diff.cambios ?? []).join(', ') ||
          `Cambio detectado en regla ${propuesta.tipoObligacion}`;

        nuevas.push(
          SugerenciaProrroga.create({
            vencimientoId: venc.id,
            estudioId: venc.estudio_id,
            clienteId: venc.cliente_id,
            tipoObligacion: venc.tipo_obligacion,
            periodo: venc.periodo,
            fechaOriginal: new Date(venc.fecha_vencimiento),
            fechaSugerida,
            motivo,
            reglaActivaId: diff.reglaActivaId ?? null,
            ejecucionIngestaId,
          }),
        );
        openSet.add(venc.id);
        sugerenciasCreadas++;
      }
    }

    await this.sugerenciaRepo.saveManyGlobal(nuevas);

    return { sugerenciasCreadas, sugerenciasOmitidas };
  }
}
