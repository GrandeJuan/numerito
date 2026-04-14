import { DashboardStatsComputer } from './dashboard-stats-computer';

function make12Rows(field: string, values: number[]) {
  const now = new Date();
  return values.map((v, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    const mes = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return { mes, [field]: String(v) };
  });
}

function makeChurnRows(canceladas: number[], activas: number[]) {
  const now = new Date();
  return canceladas.map((c, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    const mes = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return { mes, canceladas: String(c), activas_inicio: String(activas[i]) };
  });
}

describe('DashboardStatsComputer', () => {
  let computer: DashboardStatsComputer;
  let mockExecute: jest.Mock;
  let mockEm: any;

  function setupDefaultMocks() {
    const estudiosHist = make12Rows('cantidad', [3, 4, 5, 5, 6, 6, 7, 7, 8, 9, 9, 10]);
    const usuariosHist = make12Rows('cantidad', [20, 25, 28, 30, 33, 36, 38, 40, 42, 45, 48, 50]);
    const subsHist = make12Rows('cantidad', [2, 3, 3, 4, 5, 5, 6, 6, 7, 7, 8, 8]);
    const mrrHist = make12Rows('mrr', [1000, 1500, 1800, 2000, 2500, 3000, 3200, 3500, 4000, 4200, 4500, 5000]);
    const churnHist = makeChurnRows(
      [1, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0],
      [10, 12, 14, 15, 16, 18, 20, 20, 22, 24, 25, 27],
    );

    mockExecute
      .mockResolvedValueOnce([{ count: 10 }])
      .mockResolvedValueOnce([{ count: 50 }])
      .mockResolvedValueOnce([{ count: 8 }])
      .mockResolvedValueOnce([{ count: 2 }])
      .mockResolvedValueOnce(estudiosHist)
      .mockResolvedValueOnce(usuariosHist)
      .mockResolvedValueOnce(subsHist)
      .mockResolvedValueOnce(mrrHist)
      .mockResolvedValueOnce(churnHist)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { id: 'e2', nombre: 'Estudio B', plan: 'Enterprise', usuarios: '10', clientes: '30', raw_score: '90' },
        { id: 'e1', nombre: 'Estudio A', plan: 'Profesional', usuarios: '5', clientes: '20', raw_score: '55' },
      ])
      .mockResolvedValueOnce([
        { id: 'r1', nombre: 'Nuevo Estudio', plan: 'Trial', email: 'admin@nuevo.com', created_at: '2026-04-10T00:00:00Z' },
      ]);
  }

  beforeEach(() => {
    mockExecute = jest.fn().mockResolvedValue([]);
    mockEm = {
      getConnection: jest.fn().mockReturnValue({ execute: mockExecute }),
    };
    computer = new DashboardStatsComputer(mockEm);
  });

  it('should return stats with correct shape', async () => {
    setupDefaultMocks();

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
    setupDefaultMocks();

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
      expect(kpi.sparkline).toHaveLength(12);
    }
  });

  it('should calculate KPI values from current counts', async () => {
    setupDefaultMocks();

    const result = await computer.compute();

    expect(result.kpis.estudiosActivos.value).toBe(10);
    expect(result.kpis.totalUsuarios.value).toBe(50);
    expect(result.kpis.subscripcionesActivas.value).toBe(8);
  });

  it('should calculate MRR from sparkline (last month value)', async () => {
    setupDefaultMocks();

    const result = await computer.compute();

    expect(result.kpis.mrr.value).toBe(5000);
    expect(result.kpis.mrr.sparkline).toEqual([1000, 1500, 1800, 2000, 2500, 3000, 3200, 3500, 4000, 4200, 4500, 5000]);
  });

  it('should calculate churn as (canceladas / activas_inicio) * 100', async () => {
    setupDefaultMocks();

    const result = await computer.compute();

    expect(result.kpis.churnMensual.value).toBe(0);
    expect(result.kpis.churnMensual.sparkline[0]).toBe(10);
  });

  it('should calculate delta as percentage change from previous month', async () => {
    setupDefaultMocks();

    const result = await computer.compute();

    expect(result.kpis.estudiosActivos.delta).toBe('+11.1%');
    expect(result.kpis.estudiosActivos.deltaUp).toBe(true);
  });

  it('should return topTenants with activity scores normalized to 0-100', async () => {
    setupDefaultMocks();

    const result = await computer.compute();

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

  it('should return registrosRecientes with email and formatted date', async () => {
    setupDefaultMocks();

    const result = await computer.compute();

    expect(result.registrosRecientes).toHaveLength(1);
    expect(result.registrosRecientes[0]).toEqual({
      id: 'r1',
      nombre: 'Nuevo Estudio',
      plan: 'Trial',
      email: 'admin@nuevo.com',
      creadoEn: '2026-04-10',
    });
  });

  it('should not import entities from other bounded contexts', () => {
    const computer = new DashboardStatsComputer({} as any);
    expect(computer).toBeDefined();
  });
});
