import type { FeriadoRepository } from '../repositories/feriado.repository';
import type { DiaFeriado } from '../entities/dia-feriado.entity';

/**
 * Domain service that adjusts a nominal due date to the next business day
 * considering weekends and holidays (national, banking, provincial, municipal).
 *
 * The algorithm:
 * 1. Load all feriados in the relevant range (nominal date + 15 days buffer).
 * 2. While the date is a weekend or a feriado that affects the given jurisdiccion,
 *    advance to the next day.
 * 3. Return the adjusted date.
 *
 * Safety: max 30 iterations to prevent infinite loops (covers any realistic
 * holiday cluster including long weekends + provincial combos).
 */
export class AjusteDiaHabilService {
  private static readonly MAX_ITERATIONS = 30;

  constructor(private readonly feriadoRepo: FeriadoRepository) {}

  async ajustar(fechaNominal: Date, jurisdiccion: string): Promise<Date> {
    // Load feriados for a generous window around the nominal date
    const desde = new Date(fechaNominal);
    const hasta = new Date(fechaNominal);
    hasta.setDate(hasta.getDate() + AjusteDiaHabilService.MAX_ITERATIONS);

    const feriados = await this.feriadoRepo.findByRango(desde, hasta);

    return this.ajustarConFeriados(fechaNominal, jurisdiccion, feriados);
  }

  /**
   * Pure computation variant — useful for testing and batch processing
   * where feriados are pre-loaded.
   */
  ajustarConFeriados(
    fechaNominal: Date,
    jurisdiccion: string,
    feriados: DiaFeriado[],
  ): Date {
    const current = new Date(fechaNominal);
    current.setHours(0, 0, 0, 0);

    // Index feriados by date string for O(1) lookup
    const feriadosByDate = new Map<string, DiaFeriado[]>();
    for (const f of feriados) {
      const key = this.dateKey(f.fecha);
      const list = feriadosByDate.get(key) ?? [];
      list.push(f);
      feriadosByDate.set(key, list);
    }

    for (let i = 0; i < AjusteDiaHabilService.MAX_ITERATIONS; i++) {
      if (!this.esNoHabil(current, jurisdiccion, feriadosByDate)) {
        return current;
      }
      current.setDate(current.getDate() + 1);
    }

    // Fallback: return the last date we checked (should never happen in practice)
    return current;
  }

  private esNoHabil(
    fecha: Date,
    jurisdiccion: string,
    feriadosByDate: Map<string, DiaFeriado[]>,
  ): boolean {
    // Weekend check: Saturday = 6, Sunday = 0
    const day = fecha.getDay();
    if (day === 0 || day === 6) return true;

    // Feriado check
    const key = this.dateKey(fecha);
    const feriadosEnFecha = feriadosByDate.get(key);
    if (feriadosEnFecha) {
      return feriadosEnFecha.some((f) => f.afecta(jurisdiccion));
    }

    return false;
  }

  private dateKey(date: Date): string {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.toISOString().slice(0, 10);
  }
}
