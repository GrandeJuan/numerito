import type { TipoObligacion } from '@numerito/shared';
import type { ReglaVencimientoRepository } from '../repositories/regla-vencimiento.repository';

export class ReglaVencimientoService {
  constructor(private readonly reglaRepo: ReglaVencimientoRepository) {}

  async calcularFechaVencimiento(
    tipo: TipoObligacion,
    cuitRaw: string,
    periodo: string,
  ): Promise<Date> {
    const [year, month] = periodo.split('-').map(Number);
    const terminacion = cuitRaw.charAt(cuitRaw.length - 1);

    const regla = await this.reglaRepo.findByTipoYTerminacion(tipo, terminacion);

    if (!regla) {
      throw new Error(`No hay regla de vencimiento para ${tipo} con terminación ${terminacion}`);
    }

    const targetMonth = regla.mesSiguiente ? month : month - 1;
    const anio = targetMonth === 12 ? year + 1 : year;
    const mes = targetMonth === 12 ? 0 : targetMonth;

    return new Date(anio, mes, regla.diaVencimiento);
  }
}
