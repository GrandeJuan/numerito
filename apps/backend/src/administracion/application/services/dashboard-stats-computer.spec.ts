import { DashboardStatsComputer } from './dashboard-stats-computer';

describe('DashboardStatsComputer', () => {
  let computer: DashboardStatsComputer;
  let mockEstudioKpis: any;
  let mockEstudioSparkline: any;
  let mockRegistrosMensuales: any;
  let mockDistribucionPlanes: any;
  let mockEstudiosRecientes: any;
  let mockUsuarioKpis: any;
  let mockTopTenants: any;
  let mockRegistrosRecientes: any;

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

    mockUsuarioKpis.execute.mockResolvedValue({
      totalUsuarios: 50,
      sparkline: [20, 25, 28, 30, 33, 36, 38, 40, 42, 45, 48, 50],
    });

    mockRegistrosMensuales.execute.mockResolvedValue([]);
    mockDistribucionPlanes.execute.mockResolvedValue([]);
    mockEstudiosRecientes.execute.mockResolvedValue([]);

    mockTopTenants.execute.mockResolvedValue([
      { id: 'e2', nombre: 'Estudio B', plan: 'Enterprise', usuarios: 10, clientes: 30, actividad: 100 },
      { id: 'e1', nombre: 'Estudio A', plan: 'Profesional', usuarios: 5, clientes: 20, actividad: 61 },
    ]);

    mockRegistrosRecientes.execute.mockResolvedValue([
      { id: 'r1', nombre: 'Nuevo Estudio', plan: 'Trial', email: 'admin@nuevo.com', creadoEn: '2026-04-10' },
    ]);
  }

  beforeEach(() => {
    mockEstudioKpis = { execute: jest.fn().mockResolvedValue({ estudiosActivos: 0, subscripcionesActivas: 0, subscripcionesPorVencer: 0 }) };
    mockEstudioSparkline = { execute: jest.fn().mockResolvedValue({ estudios: [], subscripciones: [], mrr: [], churn: [] }) };
    mockRegistrosMensuales = { execute: jest.fn().mockResolvedValue([]) };
    mockDistribucionPlanes = { execute: jest.fn().mockResolvedValue([]) };
    mockEstudiosRecientes = { execute: jest.fn().mockResolvedValue([]) };
    mockUsuarioKpis = { execute: jest.fn().mockResolvedValue({ totalUsuarios: 0, sparkline: [] }) };
    mockTopTenants = { execute: jest.fn().mockResolvedValue([]) };
    mockRegistrosRecientes = { execute: jest.fn().mockResolvedValue([]) };

    computer = new DashboardStatsComputer(
      mockEstudioKpis,
      mockEstudioSparkline,
      mockRegistrosMensuales,
      mockDistribucionPlanes,
      mockEstudiosRecientes,
      mockUsuarioKpis,
      mockTopTenants,
      mockRegistrosRecientes,
    );
  });

  it('should return stats with correct shape', async () => {
    setupDefaultViews();

    const result = await computer.compute();

    expect(result).toHaveProperty('kpis');
    expect(result).toHaveProperty('growthData');
    expect(result).toHaveProperty('revenueData');
    expect(result).toHaveProperty('registrosMensuales');
    expect(result).toHaveProperty('distribucionPlanes');
    expect(result).toHaveProperty('alertas');
    expect(result).toHaveProperty('estudiosRecientes');
    expect(result).toHaveProperty('topTenants');
    expect(result).toHaveProperty('registrosRecientes');
  });

  it('should return 6 KPIs with sparkline data', async () => {
    setupDefaultViews();

    const result = await computer.compute();

    const kpiKeys = ['estudiosActivos', 'totalUsuarios', 'subscripcionesActivas', 'mrr', 'churnMensual', 'uptime'];
    for (const key of kpiKeys) {
      const kpi = (result.kpis as any)[key];
      expect(kpi).toHaveProperty('value');
      expect(kpi).toHaveProperty('delta');
      expect(kpi).toHaveProperty('deltaUp');
      expect(kpi).toHaveProperty('sparkline');
      expect(typeof kpi.value).toBe('number');
      expect(typeof kpi.delta).toBe('string');
      expect(typeof kpi.deltaUp).toBe('boolean');
      expect(Array.isArray(kpi.sparkline)).toBe(true);
    }
  });

  it('should calculate KPI values from view results', async () => {
    setupDefaultViews();

    const result = await computer.compute();

    expect(result.kpis.estudiosActivos.value).toBe(10);
    expect(result.kpis.totalUsuarios.value).toBe(50);
    expect(result.kpis.subscripcionesActivas.value).toBe(8);
  });

  it('should calculate MRR from sparkline (last month value)', async () => {
    setupDefaultViews();

    const result = await computer.compute();

    expect(result.kpis.mrr.value).toBe(5000);
    expect(result.kpis.mrr.sparkline).toEqual([1000, 1500, 1800, 2000, 2500, 3000, 3200, 3500, 4000, 4200, 4500, 5000]);
  });

  it('should calculate churn from sparkline (last month value)', async () => {
    setupDefaultViews();

    const result = await computer.compute();

    expect(result.kpis.churnMensual.value).toBe(0);
    expect(result.kpis.churnMensual.sparkline[0]).toBe(10);
  });

  it('should calculate delta as percentage change from previous month', async () => {
    setupDefaultViews();

    const result = await computer.compute();

    expect(result.kpis.estudiosActivos.delta).toBe('+11.1%');
    expect(result.kpis.estudiosActivos.deltaUp).toBe(true);
  });

  it('should delegate estudio KPIs to EstudioAdminKpisView', async () => {
    setupDefaultViews();

    await computer.compute();

    expect(mockEstudioKpis.execute).toHaveBeenCalledTimes(1);
  });

  it('should delegate sparklines to EstudioAdminSparklineView', async () => {
    setupDefaultViews();

    await computer.compute();

    expect(mockEstudioSparkline.execute).toHaveBeenCalledTimes(1);
  });

  it('should delegate usuario KPIs to UsuarioAdminKpisView', async () => {
    setupDefaultViews();

    await computer.compute();

    expect(mockUsuarioKpis.execute).toHaveBeenCalledTimes(1);
  });

  it('should delegate registros mensuales to view', async () => {
    setupDefaultViews();

    await computer.compute();

    expect(mockRegistrosMensuales.execute).toHaveBeenCalledTimes(1);
  });

  it('should delegate distribucion planes to view', async () => {
    setupDefaultViews();

    await computer.compute();

    expect(mockDistribucionPlanes.execute).toHaveBeenCalledTimes(1);
  });

  it('should delegate estudios recientes to view', async () => {
    setupDefaultViews();

    await computer.compute();

    expect(mockEstudiosRecientes.execute).toHaveBeenCalledTimes(1);
  });

  it('should delegate topTenants to EstudioTopTenantsView', async () => {
    setupDefaultViews();

    const result = await computer.compute();

    expect(mockTopTenants.execute).toHaveBeenCalledTimes(1);
    expect(result.topTenants).toHaveLength(2);
    expect(result.topTenants[0]).toEqual({
      id: 'e2',
      nombre: 'Estudio B',
      plan: 'Enterprise',
      usuarios: 10,
      clientes: 30,
      actividad: 100,
    });
    expect(result.topTenants[1].actividad).toBe(61);
  });

  it('should delegate registrosRecientes to EstudioRegistrosRecientesView', async () => {
    setupDefaultViews();

    const result = await computer.compute();

    expect(mockRegistrosRecientes.execute).toHaveBeenCalledTimes(1);
    expect(result.registrosRecientes).toHaveLength(1);
    expect(result.registrosRecientes[0]).toEqual({
      id: 'r1',
      nombre: 'Nuevo Estudio',
      plan: 'Trial',
      email: 'admin@nuevo.com',
      creadoEn: '2026-04-10',
    });
  });

  it('should generate alerta when subscripciones por vencer > 0', async () => {
    setupDefaultViews();

    const result = await computer.compute();

    expect(result.alertas).toHaveLength(1);
    expect(result.alertas[0].tipo).toBe('warning');
    expect(result.alertas[0].mensaje).toContain('2 subscripciones');
  });

  it('should not generate alertas when no subscripciones por vencer', async () => {
    setupDefaultViews();
    mockEstudioKpis.execute.mockResolvedValue({
      estudiosActivos: 10,
      subscripcionesActivas: 8,
      subscripcionesPorVencer: 0,
    });

    const result = await computer.compute();

    expect(result.alertas).toHaveLength(0);
  });

  it('should use zero raw SQL calls — all delegated to views', async () => {
    setupDefaultViews();

    await computer.compute();

    // All 8 views should be called, no raw SQL
    expect(mockEstudioKpis.execute).toHaveBeenCalledTimes(1);
    expect(mockEstudioSparkline.execute).toHaveBeenCalledTimes(1);
    expect(mockUsuarioKpis.execute).toHaveBeenCalledTimes(1);
    expect(mockRegistrosMensuales.execute).toHaveBeenCalledTimes(1);
    expect(mockDistribucionPlanes.execute).toHaveBeenCalledTimes(1);
    expect(mockEstudiosRecientes.execute).toHaveBeenCalledTimes(1);
    expect(mockTopTenants.execute).toHaveBeenCalledTimes(1);
    expect(mockRegistrosRecientes.execute).toHaveBeenCalledTimes(1);
  });
});
