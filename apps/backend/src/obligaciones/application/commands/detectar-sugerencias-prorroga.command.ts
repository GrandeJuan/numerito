import { EntityManager } from '@mikro-orm/postgresql';
import { SugerenciaProrroga } from '../../domain/entities/sugerencia-prorroga.entity';
import type { DiffRegla } from '../../../integraciones/application/commands/procesar-resultado-scraping.command';
import { SugerenciaProrrogaEntity } from '../../infrastructure/persistence/sugerencia-prorroga.schema';
import { VencimientoEntity } from '../../infrastructure/persistence/vencimiento.schema';
import { EstudioEntity } from '../../../estudio/infrastructure/persistence/estudio.schema';

export interface DetectarSugerenciasProrrogaCommand {
  /** Modified rules from scraping with their diffs */
  reglasModificadas: DiffRegla[];
  /** Ejecución ingesta ID for traceability */
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
 * and affect vencimientos across all tenants. Creates per-tenant sugerencias.
 */
export class DetectarSugerenciasProrrogaHandler {
  constructor(private readonly em: EntityManager) {}

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

    // Find all PENDIENTE vencimientos matching modified rule tipos (cross-tenant)
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

    // Check existing open sugerencias to avoid duplicates
    const existingOpen = await conn.execute<{ vencimiento_id: string }[]>(
      `SELECT vencimiento_id FROM sugerencia_prorroga WHERE estado = 'ABIERTA'`,
    );
    const openSet = new Set(existingOpen.map((r) => r.vencimiento_id));

    for (const diff of reglasModificadas) {
      if (diff.tipo !== 'MODIFICADA') continue;
      const { propuesta } = diff;

      const matching = pendientes.filter(
        (v) => v.tipo_obligacion === propuesta.tipoObligacion,
      );

      for (const venc of matching) {
        // Skip if already has an open sugerencia
        if (openSet.has(venc.id)) {
          sugerenciasOmitidas++;
          continue;
        }

        // Calculate new date from proposed rule
        const [yearStr, monthStr] = venc.periodo.split('-');
        const year = Number(yearStr);
        const month = Number(monthStr) - 1; // 0-based
        const targetMonth = propuesta.mesSiguiente ? month + 1 : month;
        const targetYear = targetMonth > 11 ? year + 1 : year;
        const normalizedMonth = targetMonth % 12;
        const fechaSugerida = new Date(targetYear, normalizedMonth, propuesta.diaVencimiento);

        // Skip if the suggested date is the same as current
        const currentDateStr = new Date(venc.fecha_vencimiento).toISOString().slice(0, 10);
        const suggestedDateStr = fechaSugerida.toISOString().slice(0, 10);
        if (currentDateStr === suggestedDateStr) {
          sugerenciasOmitidas++;
          continue;
        }

        const motivo = (diff.cambios ?? []).join(', ')
          || `Cambio detectado en regla ${propuesta.tipoObligacion}`;

        const sugerencia = SugerenciaProrroga.create({
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
        });

        // Persist via raw MikroORM create
        this.em.create(SugerenciaProrrogaEntity, {
          id: sugerencia.id,
          vencimiento: this.em.getReference(VencimientoEntity, venc.id),
          estudio: this.em.getReference(EstudioEntity, venc.estudio_id),
          clienteId: venc.cliente_id,
          tipoObligacion: venc.tipo_obligacion,
          periodo: venc.periodo,
          fechaOriginal: sugerencia.fechaOriginal,
          fechaSugerida: sugerencia.fechaSugerida,
          motivo: sugerencia.motivo,
          estado: sugerencia.estado,
          reglaActivaId: sugerencia.reglaActivaId,
          ejecucionIngestaId: sugerencia.ejecucionIngestaId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        openSet.add(venc.id); // Avoid duplicates within same batch
        sugerenciasCreadas++;
      }
    }

    if (sugerenciasCreadas > 0) {
      await this.em.flush();
    }

    return { sugerenciasCreadas, sugerenciasOmitidas };
  }
}
