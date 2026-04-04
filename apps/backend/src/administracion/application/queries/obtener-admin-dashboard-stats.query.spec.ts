// Mock MikroORM entities before importing the handler
jest.mock('../../../estudio/infrastructure/persistence/estudio.schema', () => ({
  EstudioEntity: class EstudioEntity {},
}));
jest.mock('../../../iam/infrastructure/persistence/usuario.schema', () => ({
  UsuarioEntity: class UsuarioEntity {},
}));
jest.mock('../../../estudio/infrastructure/persistence/subscripcion.schema', () => ({
  SubscripcionEntity: class SubscripcionEntity {},
}));

import { ObtenerAdminDashboardStatsHandler } from './obtener-admin-dashboard-stats.query';

describe('ObtenerAdminDashboardStatsHandler', () => {
  let handler: ObtenerAdminDashboardStatsHandler;
  let mockExecute: jest.Mock;
  let mockEm: any;

  beforeEach(() => {
    mockExecute = jest.fn().mockResolvedValue([]);
    mockEm = {
      count: jest.fn().mockResolvedValue(0),
      find: jest.fn().mockResolvedValue([]),
      getConnection: jest.fn().mockReturnValue({ execute: mockExecute }),
    };
    handler = new ObtenerAdminDashboardStatsHandler(mockEm);
  });

  it('should return stats with correct shape', async () => {
    mockExecute.mockResolvedValue([{ mrr: '0' }]);

    const result = await handler.execute();

    expect(result).toHaveProperty('kpis');
    expect(result).toHaveProperty('registrosMensuales');
    expect(result).toHaveProperty('distribucionPlanes');
    expect(result).toHaveProperty('alertas');
    expect(result).toHaveProperty('estudiosRecientes');
  });

  it('should return KPIs with numeric values', async () => {
    mockEm.count
      .mockResolvedValueOnce(5)   // estudios activos
      .mockResolvedValueOnce(20)  // total usuarios
      .mockResolvedValueOnce(2);  // subscripciones por vencer

    mockExecute
      .mockResolvedValueOnce([{ mrr: '15000.00' }])  // MRR query
      .mockResolvedValueOnce([])                       // registros mensuales
      .mockResolvedValueOnce([]);                      // distribucion planes

    const result = await handler.execute();

    expect(result.kpis.estudiosActivos).toBe(5);
    expect(result.kpis.totalUsuarios).toBe(20);
    expect(result.kpis.subscripcionesPorVencer).toBe(2);
    expect(result.kpis.mrr).toBe(15000);
  });

  it('should return zero MRR when no subscriptions exist', async () => {
    mockExecute
      .mockResolvedValueOnce([{ mrr: null }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const result = await handler.execute();

    expect(result.kpis.mrr).toBe(0);
  });

  it('should return registrosMensuales as array of 12 months', async () => {
    mockExecute
      .mockResolvedValueOnce([{ mrr: '0' }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const result = await handler.execute();

    expect(result.registrosMensuales).toHaveLength(12);
    result.registrosMensuales.forEach((r) => {
      expect(r).toHaveProperty('mes');
      expect(r).toHaveProperty('cantidad');
      expect(typeof r.cantidad).toBe('number');
    });
  });

  it('should return distribucionPlanes from query', async () => {
    mockExecute
      .mockResolvedValueOnce([{ mrr: '0' }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { plan: 'Profesional', cantidad: '5' },
        { plan: 'Starter', cantidad: '3' },
      ]);

    const result = await handler.execute();

    expect(result.distribucionPlanes).toEqual([
      { plan: 'Profesional', cantidad: 5 },
      { plan: 'Starter', cantidad: 3 },
    ]);
  });

  it('should return estudiosRecientes mapped correctly', async () => {
    mockExecute
      .mockResolvedValueOnce([{ mrr: '0' }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    mockEm.find.mockResolvedValue([
      {
        id: 'uuid-1',
        nombre: 'Estudio Contable X',
        plan: { nombre: 'Profesional' },
        isActive: true,
        createdAt: new Date('2026-01-15'),
      },
    ]);

    const result = await handler.execute();

    expect(result.estudiosRecientes).toHaveLength(1);
    expect(result.estudiosRecientes[0]).toEqual({
      id: 'uuid-1',
      nombre: 'Estudio Contable X',
      plan: 'Profesional',
      estado: 'Activo',
      creadoEn: '2026-01-15',
    });
  });

  it('should include alert when subscriptions are expiring', async () => {
    mockEm.count
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(3);  // subscripciones por vencer

    mockExecute
      .mockResolvedValueOnce([{ mrr: '0' }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const result = await handler.execute();

    expect(result.alertas).toHaveLength(1);
    expect(result.alertas[0].tipo).toBe('warning');
    expect(result.alertas[0].mensaje).toContain('3 subscripciones');
  });

  it('should return empty alertas when nothing is expiring', async () => {
    mockExecute
      .mockResolvedValueOnce([{ mrr: '0' }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const result = await handler.execute();

    expect(result.alertas).toHaveLength(0);
  });
});
