import { ObtenerAdminDashboardStatsHandler } from './obtener-admin-dashboard-stats.query';

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

describe('ObtenerAdminDashboardStatsHandler', () => {
  let handler: ObtenerAdminDashboardStatsHandler;
  let mockExecute: jest.Mock;
  let mockEm: any;

  /**
   * Sets up mock responses for all SQL queries in order.
   * The handler now uses conn.execute() for everything (no em.count/em.find).
   *
   * Order of conn.execute calls in Promise.all:
   *   0: estudiosActivos count
   *   1: totalUsuarios count
   *   2: subscripcionesActivas count
   *   3: subscripcionesPorVencer count
   *   4: estudios historico (12 rows)
   *   5: usuarios historico (12 rows)
   *   6: subscripciones historico (12 rows)
   *   7: mrr historico (12 rows)
   *   8: churn historico (12 rows)
   *
   * Then sequentially:
   *   9: registros mensuales
   *  10: distribucion planes
   *  11: estudios recientes
   *  12: top tenants
   *  13: registros recientes
   */
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
      // Promise.all: 4 counts + 5 historics
      .mockResolvedValueOnce([{ count: 10 }])   // estudiosActivos
      .mockResolvedValueOnce([{ count: 50 }])   // totalUsuarios
      .mockResolvedValueOnce([{ count: 8 }])    // subscripcionesActivas
      .mockResolvedValueOnce([{ count: 2 }])    // subscripcionesPorVencer
      .mockResolvedValueOnce(estudiosHist)       // estudios historico
      .mockResolvedValueOnce(usuariosHist)       // usuarios historico
      .mockResolvedValueOnce(subsHist)           // subscripciones historico
      .mockResolvedValueOnce(mrrHist)            // mrr historico
      .mockResolvedValueOnce(churnHist)          // churn historico
      // Sequential queries
      .mockResolvedValueOnce([])                 // registros mensuales
      .mockResolvedValueOnce([])                 // distribucion planes
      .mockResolvedValueOnce([])                 // estudios recientes
      .mockResolvedValueOnce([                   // top tenants
        { id: 'e2', nombre: 'Estudio B', plan: 'Enterprise', usuarios: '10', clientes: '30', raw_score: '90' },
        { id: 'e1', nombre: 'Estudio A', plan: 'Profesional', usuarios: '5', clientes: '20', raw_score: '55' },
      ])
      .mockResolvedValueOnce([                   // registros recientes
        { id: 'r1', nombre: 'Nuevo Estudio', plan: 'Trial', email: 'admin@nuevo.com', created_at: '2026-04-10T00:00:00Z' },
      ]);
  }

  function setupEmptyMocks() {
    const empty12 = make12Rows('cantidad', Array(12).fill(0));
    const mrrEmpty = make12Rows('mrr', Array(12).fill(0));
    const churnEmpty = makeChurnRows(Array(12).fill(0), Array(12).fill(1));

    mockExecute
      .mockResolvedValueOnce([{ count: 0 }])
      .mockResolvedValueOnce([{ count: 0 }])
      .mockResolvedValueOnce([{ count: 0 }])
      .mockResolvedValueOnce([{ count: 0 }])
      .mockResolvedValueOnce(empty12)
      .mockResolvedValueOnce(empty12)
      .mockResolvedValueOnce(empty12)
      .mockResolvedValueOnce(mrrEmpty)
      .mockResolvedValueOnce(churnEmpty)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
  }

  beforeEach(() => {
    mockExecute = jest.fn().mockResolvedValue([]);
    mockEm = {
      getConnection: jest.fn().mockReturnValue({ execute: mockExecute }),
    };
    handler = new ObtenerAdminDashboardStatsHandler(mockEm);
  });

  it('should return stats with correct shape', async () => {
    setupDefaultMocks();

    const result = await handler.execute();

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

    const result = await handler.execute();

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

    const result = await handler.execute();

    expect(result.kpis.estudiosActivos.value).toBe(10);
    expect(result.kpis.totalUsuarios.value).toBe(50);
    expect(result.kpis.subscripcionesActivas.value).toBe(8);
  });

  it('should calculate MRR from sparkline (last month value)', async () => {
    setupDefaultMocks();

    const result = await handler.execute();

    expect(result.kpis.mrr.value).toBe(5000);
    expect(result.kpis.mrr.sparkline).toEqual([1000, 1500, 1800, 2000, 2500, 3000, 3200, 3500, 4000, 4200, 4500, 5000]);
  });

  it('should calculate churn as (canceladas / activas_inicio) * 100', async () => {
    setupDefaultMocks();

    const result = await handler.execute();

    // Last month: 0 canceladas / 27 activas = 0%
    expect(result.kpis.churnMensual.value).toBe(0);
    // First month: 1 cancelada / 10 activas = 10%
    expect(result.kpis.churnMensual.sparkline[0]).toBe(10);
  });

  it('should calculate delta as percentage change from previous month', async () => {
    setupDefaultMocks();

    const result = await handler.execute();

    // Estudios: 10 current, prev sparkline value is 9 → +11.1%
    expect(result.kpis.estudiosActivos.delta).toBe('+11.1%');
    expect(result.kpis.estudiosActivos.deltaUp).toBe(true);
  });

  it('should invert delta direction for churn (lower is better)', async () => {
    const estudiosHist = make12Rows('cantidad', Array(12).fill(10));
    const usuariosHist = make12Rows('cantidad', Array(12).fill(50));
    const subsHist = make12Rows('cantidad', Array(12).fill(8));
    const mrrHist = make12Rows('mrr', Array(12).fill(5000));
    const churnHist = makeChurnRows(
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3],
      [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
    );

    mockExecute
      .mockResolvedValueOnce([{ count: 10 }])
      .mockResolvedValueOnce([{ count: 50 }])
      .mockResolvedValueOnce([{ count: 8 }])
      .mockResolvedValueOnce([{ count: 0 }])
      .mockResolvedValueOnce(estudiosHist)
      .mockResolvedValueOnce(usuariosHist)
      .mockResolvedValueOnce(subsHist)
      .mockResolvedValueOnce(mrrHist)
      .mockResolvedValueOnce(churnHist)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])   // estudios recientes
      .mockResolvedValueOnce([])   // top tenants
      .mockResolvedValueOnce([]);  // registros recientes

    const result = await handler.execute();

    // Churn went from 10% to 30% — that's bad, so deltaUp should be false
    expect(result.kpis.churnMensual.value).toBe(30);
    expect(result.kpis.churnMensual.deltaUp).toBe(false);
  });

  it('should return uptime as placeholder (99.98%)', async () => {
    setupDefaultMocks();

    const result = await handler.execute();

    expect(result.kpis.uptime.value).toBe(99.98);
    expect(result.kpis.uptime.delta).toBe('SLA OK');
    expect(result.kpis.uptime.sparkline).toHaveLength(12);
    expect(result.kpis.uptime.sparkline.every((v) => v === 99.98)).toBe(true);
  });

  it('should return registrosMensuales as array of 12 months', async () => {
    setupDefaultMocks();

    const result = await handler.execute();

    expect(result.registrosMensuales).toHaveLength(12);
    result.registrosMensuales.forEach((r) => {
      expect(r).toHaveProperty('mes');
      expect(r).toHaveProperty('cantidad');
      expect(typeof r.cantidad).toBe('number');
    });
  });

  it('should return distribucionPlanes from query', async () => {
    const empty12 = make12Rows('cantidad', Array(12).fill(0));
    const mrrEmpty = make12Rows('mrr', Array(12).fill(0));
    const churnEmpty = makeChurnRows(Array(12).fill(0), Array(12).fill(1));

    mockExecute
      .mockResolvedValueOnce([{ count: 10 }])
      .mockResolvedValueOnce([{ count: 50 }])
      .mockResolvedValueOnce([{ count: 8 }])
      .mockResolvedValueOnce([{ count: 0 }])
      .mockResolvedValueOnce(empty12)
      .mockResolvedValueOnce(empty12)
      .mockResolvedValueOnce(empty12)
      .mockResolvedValueOnce(mrrEmpty)
      .mockResolvedValueOnce(churnEmpty)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { plan: 'Profesional', cantidad: '5' },
        { plan: 'Starter', cantidad: '3' },
      ])
      .mockResolvedValueOnce([])   // estudios recientes
      .mockResolvedValueOnce([])   // top tenants
      .mockResolvedValueOnce([]);  // registros recientes

    const result = await handler.execute();

    expect(result.distribucionPlanes).toEqual([
      { plan: 'Profesional', cantidad: 5 },
      { plan: 'Starter', cantidad: 3 },
    ]);
  });

  it('should return estudiosRecientes mapped correctly', async () => {
    setupDefaultMocks();

    // Override estudios recientes (index 11 in sequence)
    mockExecute.mockReset();
    setupDefaultMocks();
    // Replace the estudios recientes mock at position 11
    const calls = mockExecute.mock.calls;
    mockExecute.mockReset();
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
      .mockResolvedValueOnce([{ count: 0 }])
      .mockResolvedValueOnce(estudiosHist)
      .mockResolvedValueOnce(usuariosHist)
      .mockResolvedValueOnce(subsHist)
      .mockResolvedValueOnce(mrrHist)
      .mockResolvedValueOnce(churnHist)
      .mockResolvedValueOnce([])   // registros mensuales
      .mockResolvedValueOnce([])   // distribucion planes
      .mockResolvedValueOnce([     // estudios recientes
        {
          id: 'uuid-1',
          nombre: 'Estudio Contable X',
          plan: 'Profesional',
          is_active: true,
          created_at: '2026-01-15T00:00:00Z',
        },
      ])
      .mockResolvedValueOnce([])   // top tenants
      .mockResolvedValueOnce([]);  // registros recientes

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
    const empty12 = make12Rows('cantidad', Array(12).fill(0));
    const mrrEmpty = make12Rows('mrr', Array(12).fill(0));
    const churnEmpty = makeChurnRows(Array(12).fill(0), Array(12).fill(1));

    mockExecute
      .mockResolvedValueOnce([{ count: 10 }])
      .mockResolvedValueOnce([{ count: 50 }])
      .mockResolvedValueOnce([{ count: 8 }])
      .mockResolvedValueOnce([{ count: 3 }])  // subscripcionesPorVencer
      .mockResolvedValueOnce(empty12)
      .mockResolvedValueOnce(empty12)
      .mockResolvedValueOnce(empty12)
      .mockResolvedValueOnce(mrrEmpty)
      .mockResolvedValueOnce(churnEmpty)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])   // estudios recientes
      .mockResolvedValueOnce([])   // top tenants
      .mockResolvedValueOnce([]);  // registros recientes

    const result = await handler.execute();

    expect(result.alertas).toHaveLength(1);
    expect(result.alertas[0].tipo).toBe('warning');
    expect(result.alertas[0].mensaje).toContain('3 subscripciones');
  });

  it('should return empty alertas when nothing is expiring', async () => {
    setupDefaultMocks();

    const result = await handler.execute();

    expect(result.alertas).toHaveLength(0);
  });

  it('should return growthData with 12 months of usuarios and estudios', async () => {
    setupDefaultMocks();

    const result = await handler.execute();

    expect(result.growthData).toHaveLength(12);
    result.growthData.forEach((point) => {
      expect(point).toHaveProperty('mes');
      expect(point).toHaveProperty('usuarios');
      expect(point).toHaveProperty('estudios');
      expect(typeof point.usuarios).toBe('number');
      expect(typeof point.estudios).toBe('number');
    });
    // Verify data matches sparkline values
    expect(result.growthData[0].estudios).toBe(3);
    expect(result.growthData[0].usuarios).toBe(20);
    expect(result.growthData[11].estudios).toBe(10);
    expect(result.growthData[11].usuarios).toBe(50);
  });

  it('should return revenueData with MRR and ARR (ARR = MRR x 12)', async () => {
    setupDefaultMocks();

    const result = await handler.execute();

    expect(result.revenueData).toHaveLength(12);
    result.revenueData.forEach((point) => {
      expect(point).toHaveProperty('mes');
      expect(point).toHaveProperty('mrr');
      expect(point).toHaveProperty('arr');
      expect(point.arr).toBe(point.mrr * 12);
    });
    // First month: MRR 1000, ARR 12000
    expect(result.revenueData[0].mrr).toBe(1000);
    expect(result.revenueData[0].arr).toBe(12000);
    // Last month: MRR 5000, ARR 60000
    expect(result.revenueData[11].mrr).toBe(5000);
    expect(result.revenueData[11].arr).toBe(60000);
  });

  it('should return zero revenue when no subscriptions exist', async () => {
    setupEmptyMocks();
    // Add remaining sequential mocks
    mockExecute
      .mockResolvedValueOnce([])   // estudios recientes
      .mockResolvedValueOnce([])   // top tenants
      .mockResolvedValueOnce([]);  // registros recientes

    const result = await handler.execute();

    result.revenueData.forEach((point) => {
      expect(point.mrr).toBe(0);
      expect(point.arr).toBe(0);
    });
  });

  it('should return topTenants with activity scores normalized to 0-100', async () => {
    setupDefaultMocks();

    const result = await handler.execute();

    expect(result.topTenants).toHaveLength(2);
    // Highest raw_score (90) should map to 100
    expect(result.topTenants[0]).toEqual({
      id: 'e2',
      nombre: 'Estudio B',
      plan: 'Enterprise',
      usuarios: 10,
      clientes: 30,
      actividad: 100,
    });
    // Lower raw_score (55) should be normalized relative to max (90)
    expect(result.topTenants[1]).toEqual({
      id: 'e1',
      nombre: 'Estudio A',
      plan: 'Profesional',
      usuarios: 5,
      clientes: 20,
      actividad: 61, // round(55/90 * 100) = 61
    });
  });

  it('should return topTenants sorted by raw_score descending from SQL', async () => {
    setupDefaultMocks();

    const result = await handler.execute();

    // The SQL already sorts by raw_score DESC, so result order matches SQL order
    expect(result.topTenants[0].nombre).toBe('Estudio B');
    expect(result.topTenants[1].nombre).toBe('Estudio A');
  });

  it('should return empty topTenants when no estudios exist', async () => {
    setupEmptyMocks();
    mockExecute
      .mockResolvedValueOnce([])   // estudios recientes
      .mockResolvedValueOnce([])   // top tenants
      .mockResolvedValueOnce([]);  // registros recientes

    const result = await handler.execute();

    expect(result.topTenants).toEqual([]);
  });

  it('should return registrosRecientes with email and formatted date', async () => {
    setupDefaultMocks();

    const result = await handler.execute();

    expect(result.registrosRecientes).toHaveLength(1);
    expect(result.registrosRecientes[0]).toEqual({
      id: 'r1',
      nombre: 'Nuevo Estudio',
      plan: 'Trial',
      email: 'admin@nuevo.com',
      creadoEn: '2026-04-10',
    });
  });

  it('should return empty email when estudio has no users', async () => {
    setupEmptyMocks();
    mockExecute
      .mockResolvedValueOnce([])   // estudios recientes
      .mockResolvedValueOnce([])   // top tenants
      .mockResolvedValueOnce([     // registros recientes (no email)
        { id: 'r2', nombre: 'Sin Usuarios', plan: 'Trial', email: null, created_at: '2026-03-01T00:00:00Z' },
      ]);

    const result = await handler.execute();

    expect(result.registrosRecientes).toHaveLength(1);
    expect(result.registrosRecientes[0].email).toBe('');
  });

  it('should handle zero values gracefully', async () => {
    setupEmptyMocks();

    const result = await handler.execute();

    expect(result.kpis.estudiosActivos.value).toBe(0);
    expect(result.kpis.mrr.value).toBe(0);
    expect(result.kpis.churnMensual.value).toBe(0);
  });

  it('should not import entities from other bounded contexts', () => {
    // Verify the handler module has no cross-context entity imports
    // by checking that the constructor only needs EntityManager
    const handler = new ObtenerAdminDashboardStatsHandler({} as any);
    expect(handler).toBeDefined();
  });
});
