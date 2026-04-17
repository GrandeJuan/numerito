import { FacturacionStatsQuery } from './facturacion-stats.query';
import { Factura, ESTADO_FACTURA } from '../../domain/entities/factura.entity';
import { LineaFactura } from '../../domain/entities/linea-factura.entity';
import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';

const principal: EstudioPrincipal = { estudioId: 'estudio-1', userId: 'user-1', roles: [] };

const makeLinea = (precio = 1000, iva = 21) =>
  LineaFactura.create({
    facturaId: 'f1',
    descripcion: 'Servicio',
    cantidad: 1,
    precioUnitario: precio,
    alicuotaIva: iva,
  });

const makeFactura = (
  overrides: {
    id?: string;
    numero?: string;
    precio?: number;
    fechaEmision?: string;
    fechaVencimiento?: string;
  } = {},
) =>
  Factura.create(
    {
      clienteId: 'cliente-1',
      estudioId: 'estudio-1',
      numero: overrides.numero ?? 'FAC-001',
      fechaEmision: new Date(overrides.fechaEmision ?? '2026-01-15'),
      fechaVencimiento: new Date(overrides.fechaVencimiento ?? '2026-03-15'),
      concepto: 'Honorarios',
      lineas: [makeLinea(overrides.precio ?? 1000)],
    },
    overrides.id,
  );

describe('FacturacionStatsQuery', () => {
  let query: FacturacionStatsQuery;
  let mockFacturaRepo: any;

  beforeEach(() => {
    mockFacturaRepo = {
      findAll: jest.fn().mockResolvedValue([]),
    };
    query = new FacturacionStatsQuery(mockFacturaRepo);
  });

  it('should return zero stats when no facturas', async () => {
    const result = await query.execute(principal);

    expect(result.facturado).toBe(0);
    expect(result.cobrado).toBe(0);
    expect(result.cobradoPorcentaje).toBe(0);
    expect(result.saldoPendiente).toBe(0);
    expect(result.facturasVencidas).toBe(0);
    expect(result.mensual).toEqual([]);
    expect(result.porEstado).toEqual([]);
    expect(mockFacturaRepo.findAll).toHaveBeenCalledWith(principal);
  });

  it('should calculate facturado as sum of totals', async () => {
    const f1 = makeFactura({ precio: 1000 }); // total = 1000 + 210 = 1210
    const f2 = makeFactura({ numero: 'FAC-002', precio: 2000 }); // total = 2000 + 420 = 2420
    mockFacturaRepo.findAll.mockResolvedValue([f1, f2]);

    const result = await query.execute(principal);
    expect(result.facturado).toBe(3630);
  });

  it('should calculate cobrado from totalPagado', async () => {
    const f1 = makeFactura({ precio: 1000 });
    f1.registrarPagoExterno(500);
    mockFacturaRepo.findAll.mockResolvedValue([f1]);

    const result = await query.execute(principal);
    expect(result.cobrado).toBe(500);
    expect(result.saldoPendiente).toBe(1210 - 500);
  });

  it('should calculate cobrado percentage', async () => {
    const f1 = makeFactura({ precio: 1000 }); // total 1210
    f1.registrarPagoExterno(605); // 50%
    mockFacturaRepo.findAll.mockResolvedValue([f1]);

    const result = await query.execute(principal);
    expect(result.cobradoPorcentaje).toBe(50);
  });

  it('should count facturas vencidas', async () => {
    const f1 = makeFactura({ fechaEmision: '2024-12-01', fechaVencimiento: '2025-01-01' });
    f1.marcarVencida();
    const f2 = makeFactura({ numero: 'FAC-002' });
    mockFacturaRepo.findAll.mockResolvedValue([f1, f2]);

    const result = await query.execute(principal);
    expect(result.facturasVencidas).toBe(1);
  });

  it('should exclude anuladas from facturado', async () => {
    const f1 = makeFactura({ precio: 1000 });
    const f2 = makeFactura({ numero: 'FAC-002', precio: 2000 });
    f2.anular();
    mockFacturaRepo.findAll.mockResolvedValue([f1, f2]);

    const result = await query.execute(principal);
    expect(result.facturado).toBe(1210);
  });

  it('should group by estado for pie chart', async () => {
    const f1 = makeFactura();
    const f2 = makeFactura({ numero: 'FAC-002' });
    f2.registrarPagoExterno(f2.total);
    const f3 = makeFactura({ numero: 'FAC-003' });
    f3.anular();
    mockFacturaRepo.findAll.mockResolvedValue([f1, f2, f3]);

    const result = await query.execute(principal);
    const emitidas = result.porEstado.find((e) => e.estado === ESTADO_FACTURA.EMITIDA);
    const pagadas = result.porEstado.find((e) => e.estado === ESTADO_FACTURA.PAGADA);
    const anuladas = result.porEstado.find((e) => e.estado === ESTADO_FACTURA.ANULADA);

    expect(emitidas?.cantidad).toBe(1);
    expect(pagadas?.cantidad).toBe(1);
    expect(anuladas?.cantidad).toBe(1);
  });

  it('should aggregate monthly facturado and cobrado', async () => {
    const f1 = makeFactura({ precio: 1000, fechaEmision: '2026-01-15' }); // 1210
    f1.registrarPagoExterno(500);
    const f2 = makeFactura({ numero: 'FAC-002', precio: 2000, fechaEmision: '2026-02-10' }); // 2420
    f2.registrarPagoExterno(1000);
    mockFacturaRepo.findAll.mockResolvedValue([f1, f2]);

    const result = await query.execute(principal);
    const enero = result.mensual.find((m) => m.mes === '2026-01');
    const febrero = result.mensual.find((m) => m.mes === '2026-02');

    expect(enero?.facturado).toBe(1210);
    expect(enero?.cobrado).toBe(500);
    expect(febrero?.facturado).toBe(2420);
    expect(febrero?.cobrado).toBe(1000);
  });
});
