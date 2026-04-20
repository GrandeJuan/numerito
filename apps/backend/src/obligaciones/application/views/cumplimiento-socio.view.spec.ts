import { CumplimientoSocioView } from './cumplimiento-socio.view';

describe('CumplimientoSocioView', () => {
  let view: CumplimientoSocioView;
  let mockExecute: jest.Mock;
  let mockEm: any;

  beforeEach(() => {
    mockExecute = jest.fn().mockResolvedValue([]);
    mockEm = {
      getConnection: jest.fn().mockReturnValue({ execute: mockExecute }),
    };
    view = new CumplimientoSocioView(mockEm);
  });

  it('should return cumplimiento grouped by responsable', async () => {
    mockExecute.mockResolvedValue([
      {
        responsable_id: 'user-1',
        responsable_nombre: 'Juan Pérez',
        total: 10,
        presentados: 7,
        vencidos: 1,
        prorrogados: 1,
        pendientes: 1,
        en_riesgo: 1,
      },
      {
        responsable_id: 'user-2',
        responsable_nombre: 'María García',
        total: 5,
        presentados: 5,
        vencidos: 0,
        prorrogados: 0,
        pendientes: 0,
        en_riesgo: 0,
      },
    ]);

    const result = await view.execute({ estudioId: 'estudio-1', periodo: '2026-04' });

    expect(result.periodo).toBe('2026-04');
    expect(result.porResponsable).toHaveLength(2);
    expect(result.porResponsable[0]).toEqual({
      responsableId: 'user-1',
      responsableNombre: 'Juan Pérez',
      total: 10,
      presentados: 7,
      vencidos: 1,
      prorrogados: 1,
      pendientes: 1,
      enRiesgo: 1,
      porcentajeCumplimiento: 70,
    });
    expect(result.porResponsable[1].porcentajeCumplimiento).toBe(100);
  });

  it('should compute resumenGeneral as aggregate of all responsables', async () => {
    mockExecute.mockResolvedValue([
      { responsable_id: 'u1', responsable_nombre: 'A', total: 6, presentados: 4, vencidos: 1, prorrogados: 0, pendientes: 1, en_riesgo: 1 },
      { responsable_id: 'u2', responsable_nombre: 'B', total: 4, presentados: 2, vencidos: 0, prorrogados: 1, pendientes: 1, en_riesgo: 0 },
    ]);

    const result = await view.execute({ estudioId: 'estudio-1', periodo: '2026-04' });

    expect(result.resumenGeneral).toEqual({
      total: 10,
      presentados: 6,
      vencidos: 1,
      prorrogados: 1,
      pendientes: 2,
      enRiesgo: 1,
      porcentajeCumplimiento: 60,
    });
  });

  it('should filter by estudioId and periodo', async () => {
    await view.execute({ estudioId: 'estudio-1', periodo: '2026-04' });

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('v.estudio_id = ?'),
      expect.arrayContaining(['estudio-1']),
    );
    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('v.periodo = ?'),
      expect.arrayContaining(['2026-04']),
    );
  });

  it('should default diasRiesgo to 3', async () => {
    await view.execute({ estudioId: 'estudio-1', periodo: '2026-04' });

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('MAKE_INTERVAL(days => ?)'),
      expect.arrayContaining([3]),
    );
  });

  it('should accept custom diasRiesgo', async () => {
    await view.execute({ estudioId: 'estudio-1', periodo: '2026-04', diasRiesgo: 7 });

    expect(mockExecute).toHaveBeenCalledWith(
      expect.any(String),
      expect.arrayContaining([7]),
    );
  });

  it('should apply optional tipoObligacionId filter', async () => {
    await view.execute({ estudioId: 'estudio-1', periodo: '2026-04', tipoObligacionId: 5 });

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('v.tipo_obligacion_id = ?'),
      expect.arrayContaining([5]),
    );
  });

  it('should apply optional clienteId filter', async () => {
    await view.execute({ estudioId: 'estudio-1', periodo: '2026-04', clienteId: 'cli-1' });

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('v.cliente_id = ?'),
      expect.arrayContaining(['cli-1']),
    );
  });

  it('should apply optional responsableId filter', async () => {
    await view.execute({ estudioId: 'estudio-1', periodo: '2026-04', responsableId: 'user-1' });

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('v.responsable_id = ?'),
      expect.arrayContaining(['user-1']),
    );
  });

  it('should return zero cumplimiento when no vencimientos', async () => {
    const result = await view.execute({ estudioId: 'estudio-empty', periodo: '2026-04' });

    expect(result.resumenGeneral).toEqual({
      total: 0,
      presentados: 0,
      vencidos: 0,
      prorrogados: 0,
      pendientes: 0,
      enRiesgo: 0,
      porcentajeCumplimiento: 0,
    });
    expect(result.porResponsable).toEqual([]);
  });

  it('should default periodo to current month when not provided', async () => {
    const now = new Date();
    const expectedPeriodo = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const result = await view.execute({ estudioId: 'estudio-1' });

    expect(result.periodo).toBe(expectedPeriodo);
  });
});
