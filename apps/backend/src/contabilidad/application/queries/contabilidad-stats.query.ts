import type { LibroContableRepository } from '../../domain/repositories/libro-contable.repository';
import type { AsientoContableRepository } from '../../domain/repositories/asiento-contable.repository';
import type { TipoLibro } from '../../domain/entities/libro-contable.entity';

export interface LibroInfo {
  id: string;
  tipo: TipoLibro;
  periodo: string;
  isRubricado: boolean;
  numeroRubrica?: string;
}

export interface MensualDebeHaber {
  mes: string;
  debe: number;
  haber: number;
}

export interface AsientoReciente {
  id: string;
  fecha: Date;
  descripcion: string;
  totalDebe: number;
  totalHaber: number;
}

export interface ContabilidadStats {
  asientosDelPeriodo: number;
  librosRubricados: number;
  totalLibros: number;
  balanceCuadrado: boolean;
  libros: LibroInfo[];
  mensualDebeHaber: MensualDebeHaber[];
  asientosRecientes: AsientoReciente[];
}

export class ContabilidadStatsQuery {
  constructor(
    private readonly libroRepo: LibroContableRepository,
    private readonly asientoRepo: AsientoContableRepository,
  ) {}

  async execute(): Promise<ContabilidadStats> {
    const [libros, asientos] = await Promise.all([
      this.libroRepo.findAll(),
      this.asientoRepo.findAll(),
    ]);

    const asientosDelPeriodo = asientos.length;
    const librosRubricados = libros.filter((l) => l.isRubricado).length;
    const totalLibros = libros.length;

    // Balance is cuadrado if total debe === total haber across all asientos
    const totalDebe = asientos.reduce((sum, a) => sum + a.totalDebe, 0);
    const totalHaber = asientos.reduce((sum, a) => sum + a.totalHaber, 0);
    const balanceCuadrado = Math.abs(totalDebe - totalHaber) < 0.01;

    const librosInfo: LibroInfo[] = libros.map((l) => ({
      id: l.id,
      tipo: l.tipo,
      periodo: l.periodo,
      isRubricado: l.isRubricado,
      numeroRubrica: l.numeroRubrica,
    }));

    // Aggregate monthly debe/haber
    const mensualMap = new Map<string, { debe: number; haber: number }>();
    for (const a of asientos) {
      const mes = `${a.fecha.getFullYear()}-${String(a.fecha.getMonth() + 1).padStart(2, '0')}`;
      const entry = mensualMap.get(mes) ?? { debe: 0, haber: 0 };
      entry.debe += a.totalDebe;
      entry.haber += a.totalHaber;
      mensualMap.set(mes, entry);
    }
    const mensualDebeHaber: MensualDebeHaber[] = Array.from(mensualMap.entries())
      .map(([mes, data]) => ({ mes, ...data }))
      .sort((a, b) => a.mes.localeCompare(b.mes));

    // Recent asientos sorted by fecha desc
    const asientosRecientes: AsientoReciente[] = [...asientos]
      .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
      .slice(0, 10)
      .map((a) => ({
        id: a.id,
        fecha: a.fecha,
        descripcion: a.descripcion,
        totalDebe: a.totalDebe,
        totalHaber: a.totalHaber,
      }));

    return {
      asientosDelPeriodo,
      librosRubricados,
      totalLibros,
      balanceCuadrado,
      libros: librosInfo,
      mensualDebeHaber,
      asientosRecientes,
    };
  }
}
