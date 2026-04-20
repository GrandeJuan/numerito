import { DashboardStatsComputer } from './dashboard-stats-computer';
import type { EstudioTopTenantDto } from '../../../estudio/application/views/estudio-top-tenants.view';

describe('DashboardStatsComputer', () => {
  let computer: DashboardStatsComputer;
  let mockEstudioKpis: any;
  let mockEstudioSparkline: any;
  let mockDistribucionPlanes: any;
  let mockTopTenants: any;

  function tenant(overrides: Partial<EstudioTopTenantDto> = {}): EstudioTopTenantDto {
    return {
      id: 'e1',
      nombre: 'Estudio Base',
      cuit: '30-11111111-1',
      planCodigo: 'PROFESIONAL',
      planNombre: 'Profesional',
      maxClientes: 50,
      estadoSubscripcion: 'ACTIVA',
      mrr: 9999,
      usuarios: 5,
      clientes: 10,
      actividad: 80,
      ...overrides,
    };
  }

  function setupDefaultViews() {
    mockEstudioKpis.execute.mockResolvedValue({
      estudiosActivos: 10,
      subscripcionesActivas: 8,
      subscripcionesPorVencer: 2,
    });

    mockEstudioSparkline.execute.mockResolvedValue({
      estudios: [3, 4, 5, 5, 6, 6, 7, 7, 8, 9, 9, 10],
      subscripciones: [2, 3, 3, 4, 5, 5, 6, 6, 7, 7, 8, 8],
      mrr: [1000, 1500, 1800, 2000, 2500, 3000, 3200, 3500, 4000, 4200, 4500, 5000],
      churn: [10, 0, 7.14, 0, 6.25, 0, 0, 5, 0, 0, 4, 0],
    });

    mockDistribucionPlanes.execute.mockResolvedValue([
      { plan: 'Profesional', cantidad: 6 },
      { plan: 'Enterprise', cantidad: 3 },
      { plan: 'Free', cantidad: 1 },
    ]);

    mockTopTenants.execute.mockResolvedValue([
      tenant({ id: 'e2', nombre: 'Big', planCodigo: 'ENTERPRISE', mrr: 49999, actividad: 100 }),
      tenant({ id: 'e3', nombre: 'Risky', planCodigo: 'PROFESIONAL', mrr: 9999, actividad: 10 }),
      tenant({
        id: 'e4',
        nombre: 'Trial Co',
        planCodigo: 'FREE',
        estadoSubscripcion: 'TRIAL',
        mrr: 0,
        actividad: 40,
      }),
      tenant({ id: 'e5', nombre: 'Late Payer', estadoSubscripcion: 'VENCIDA', actividad: 5 }),
    ]);
  }

  beforeEach(() => {
    mockEstudioKpis = {
      execute: jest.fn().mockResolvedValue({
        estudiosActivos: 0,
        subscripcionesActivas: 0,
        subscripcionesPorVencer: 0,
      }),
    };
    mockEstudioSparkline = {
      execute: jest
        .fn()
        .mockResolvedValue({ estudios: [], subscripciones: [], mrr: [], churn: [] }),
    };
    mockDistribucionPlanes = { execute: jest.fn().mockResolvedValue([]) };
    mockTopTenants = { execute: jest.fn().mockResolvedValue([]) };

    computer = new DashboardStatsComputer(
      mockEstudioKpis,
      mockEstudioSparkline,
      mockDistribucionPlanes,
      mockTopTenants,
    );
  });

  it('returns the snapshot-shaped subset', async () => {
    setupDefaultViews();

    const result = await computer.compute();

    expect(result).toEqual(
      expect.objectContaining({
        kpis: expect.objectContaining({
          mrr: expect.anything(),
          estudiosActivos: expect.anything(),
        }),
        growth: expect.any(Array),
        planDistribution: expect.any(Array),
        topStudios: expect.any(Array),
      }),
    );
  });

  it('builds mrr KPI from last sparkline value + delta', async () => {
    setupDefaultViews();

    const result = await computer.compute();

    expect(result.kpis.mrr.value).toBe(5000);
    expect(result.kpis.mrr.sparkline).toHaveLength(12);
    expect(result.kpis.mrr.delta).toBe('+11.1%');
    expect(result.kpis.mrr.deltaUp).toBe(true);
  });

  it('builds estudiosActivos KPI from view count', async () => {
    setupDefaultViews();

    const result = await computer.compute();

    expect(result.kpis.estudiosActivos.value).toBe(10);
    expect(result.kpis.estudiosActivos.sparkline).toHaveLength(12);
  });

  it('builds 12 growth points with month + mrr + newStudios + churn', async () => {
    setupDefaultViews();

    const result = await computer.compute();

    expect(result.growth).toHaveLength(12);
    expect(result.growth[0]).toEqual(
      expect.objectContaining({
        month: expect.any(String),
        mrr: 1000,
        newStudios: 3,
        churn: 10,
      }),
    );
    expect(result.growth[11]).toEqual(
      expect.objectContaining({ mrr: 5000, newStudios: 1, churn: 0 }),
    );
  });

  it('computes percent + tone for planDistribution', async () => {
    setupDefaultViews();

    const result = await computer.compute();

    expect(result.planDistribution).toEqual([
      { plan: 'Profesional', count: 6, percent: 60, tone: 'brand' },
      { plan: 'Enterprise', count: 3, percent: 30, tone: 'indigo' },
      { plan: 'Free', count: 1, percent: 10, tone: 'amber' },
    ]);
  });

  it('maps top tenants to AdminTopStudio with plan slug + status + initialsColor', async () => {
    setupDefaultViews();

    const result = await computer.compute();

    expect(result.topStudios).toHaveLength(4);

    const big = result.topStudios[0];
    expect(big).toMatchObject({
      id: 'e2',
      plan: 'enterprise',
      status: 'active',
      initialsColor: 'indigo',
      mrr: 49999,
      clientesMax: 50,
    });

    const risky = result.topStudios[1];
    expect(risky.status).toBe('risk');

    const trial = result.topStudios[2];
    expect(trial).toMatchObject({ plan: 'trial', status: 'trial', mrr: null });

    const latePayer = result.topStudios[3];
    expect(latePayer).toMatchObject({
      status: 'payment_failed',
      mrr: null,
      initialsColor: 'neutral',
    });
  });

  it('omits clientesMax when plan has unlimited cupo (>=999999)', async () => {
    setupDefaultViews();
    mockTopTenants.execute.mockResolvedValueOnce([
      tenant({ planCodigo: 'ENTERPRISE', maxClientes: 999999 }),
    ]);

    const result = await computer.compute();

    expect(result.topStudios[0].clientesMax).toBeUndefined();
  });

  it('delegates to the four views in parallel', async () => {
    setupDefaultViews();

    await computer.compute();

    expect(mockEstudioKpis.execute).toHaveBeenCalledTimes(1);
    expect(mockEstudioSparkline.execute).toHaveBeenCalledTimes(1);
    expect(mockDistribucionPlanes.execute).toHaveBeenCalledTimes(1);
    expect(mockTopTenants.execute).toHaveBeenCalledTimes(1);
  });

  it('handles empty results without crashing', async () => {
    const result = await computer.compute();

    expect(result.kpis.mrr.value).toBe(0);
    expect(result.kpis.estudiosActivos.value).toBe(0);
    expect(result.growth).toHaveLength(12);
    expect(result.planDistribution).toEqual([]);
    expect(result.topStudios).toEqual([]);
  });
});
