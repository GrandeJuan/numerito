import { ContabilidadStatsQuery } from './contabilidad-stats.query';
import { LibroContable } from '../../domain/entities/libro-contable.entity';
import { AsientoContable, LineaAsiento } from '../../domain/entities/asiento-contable.entity';

const makeLibro = (overrides: { tipo?: string; id?: string } = {}) =>
  LibroContable.create({
    clienteId: 'cliente-1',
    estudioId: 'estudio-1',
    tipo: (overrides.tipo ?? 'DIARIO') as any,
    periodo: '2026-01',
  }, overrides.id);

const balancedLineas = (debe: number): LineaAsiento[] => [
  { cuentaId: 'c1', debe, haber: 0, descripcion: 'Debe' },
  { cuentaId: 'c2', debe: 0, haber: debe, descripcion: 'Haber' },
];

const makeAsiento = (overrides: { fecha?: string; debe?: number; id?: string } = {}) =>
  AsientoContable.create({
    libroId: 'libro-1',
    clienteId: 'cliente-1',
    estudioId: 'estudio-1',
    fecha: new Date(overrides.fecha ?? '2026-01-15'),
    descripcion: 'Asiento test',
    lineas: balancedLineas(overrides.debe ?? 1000),
  }, overrides.id);

describe('ContabilidadStatsQuery', () => {
  let query: ContabilidadStatsQuery;
  let mockLibroRepo: any;
  let mockAsientoRepo: any;

  beforeEach(() => {
    mockLibroRepo = {
      findByEstudioId: jest.fn().mockResolvedValue([]),
    };
    mockAsientoRepo = {
      findByEstudioId: jest.fn().mockResolvedValue([]),
    };
    query = new ContabilidadStatsQuery(mockLibroRepo, mockAsientoRepo);
  });

  it('should return zero stats when no data', async () => {
    const result = await query.execute('estudio-1');

    expect(result.asientosDelPeriodo).toBe(0);
    expect(result.librosRubricados).toBe(0);
    expect(result.totalLibros).toBe(0);
    expect(result.balanceCuadrado).toBe(true);
    expect(result.libros).toEqual([]);
    expect(result.mensualDebeHaber).toEqual([]);
    expect(result.asientosRecientes).toEqual([]);
  });

  it('should count asientos del periodo', async () => {
    const asientos = [makeAsiento(), makeAsiento({ id: 'a2' })];
    mockAsientoRepo.findByEstudioId.mockResolvedValue(asientos);

    const result = await query.execute('estudio-1');
    expect(result.asientosDelPeriodo).toBe(2);
  });

  it('should count libros rubricados vs total', async () => {
    const l1 = makeLibro({ tipo: 'DIARIO' });
    const l2 = makeLibro({ tipo: 'IVA_COMPRAS', id: 'l2' });
    l1.rubricar('RUB-001');
    mockLibroRepo.findByEstudioId.mockResolvedValue([l1, l2]);

    const result = await query.execute('estudio-1');
    expect(result.librosRubricados).toBe(1);
    expect(result.totalLibros).toBe(2);
  });

  it('should detect balance cuadrado when all asientos balanced', async () => {
    const asientos = [makeAsiento({ debe: 1000 }), makeAsiento({ debe: 2000, id: 'a2' })];
    mockAsientoRepo.findByEstudioId.mockResolvedValue(asientos);

    const result = await query.execute('estudio-1');
    expect(result.balanceCuadrado).toBe(true);
  });

  it('should return libros with rubrica status', async () => {
    const l1 = makeLibro({ tipo: 'DIARIO' });
    const l2 = makeLibro({ tipo: 'IVA_COMPRAS', id: 'l2' });
    l1.rubricar('RUB-001');
    mockLibroRepo.findByEstudioId.mockResolvedValue([l1, l2]);

    const result = await query.execute('estudio-1');
    expect(result.libros).toHaveLength(2);
    const diario = result.libros.find(l => l.tipo === 'DIARIO');
    expect(diario?.isRubricado).toBe(true);
    const ivaCompras = result.libros.find(l => l.tipo === 'IVA_COMPRAS');
    expect(ivaCompras?.isRubricado).toBe(false);
  });

  it('should aggregate monthly debe/haber', async () => {
    const a1 = makeAsiento({ fecha: '2026-01-15', debe: 1000 });
    const a2 = makeAsiento({ fecha: '2026-01-20', debe: 2000, id: 'a2' });
    const a3 = makeAsiento({ fecha: '2026-02-10', debe: 3000, id: 'a3' });
    mockAsientoRepo.findByEstudioId.mockResolvedValue([a1, a2, a3]);

    const result = await query.execute('estudio-1');
    const enero = result.mensualDebeHaber.find(m => m.mes === '2026-01');
    const febrero = result.mensualDebeHaber.find(m => m.mes === '2026-02');

    expect(enero?.debe).toBe(3000);
    expect(enero?.haber).toBe(3000);
    expect(febrero?.debe).toBe(3000);
    expect(febrero?.haber).toBe(3000);
  });

  it('should return recent asientos sorted by fecha desc', async () => {
    const a1 = makeAsiento({ fecha: '2026-01-15', id: 'a1' });
    const a2 = makeAsiento({ fecha: '2026-03-01', id: 'a2' });
    const a3 = makeAsiento({ fecha: '2026-02-10', id: 'a3' });
    mockAsientoRepo.findByEstudioId.mockResolvedValue([a1, a2, a3]);

    const result = await query.execute('estudio-1');
    expect(result.asientosRecientes[0].id).toBe('a2');
    expect(result.asientosRecientes[1].id).toBe('a3');
    expect(result.asientosRecientes[2].id).toBe('a1');
  });
});
