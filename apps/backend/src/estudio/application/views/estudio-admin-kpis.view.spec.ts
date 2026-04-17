import { EstudioAdminKpisView } from './estudio-admin-kpis.view';

describe('EstudioAdminKpisView', () => {
  let view: EstudioAdminKpisView;
  let mockExecute: jest.Mock;

  beforeEach(() => {
    mockExecute = jest.fn().mockResolvedValue([{ count: 0 }]);
    const mockEm: any = {
      getConnection: jest.fn().mockReturnValue({ execute: mockExecute }),
    };
    view = new EstudioAdminKpisView(mockEm);
  });

  it('should return estudios activos count', async () => {
    mockExecute
      .mockResolvedValueOnce([{ count: 15 }])
      .mockResolvedValueOnce([{ count: 10 }])
      .mockResolvedValueOnce([{ count: 3 }]);

    const result = await view.execute();

    expect(result.estudiosActivos).toBe(15);
  });

  it('should return subscripciones activas count', async () => {
    mockExecute
      .mockResolvedValueOnce([{ count: 15 }])
      .mockResolvedValueOnce([{ count: 10 }])
      .mockResolvedValueOnce([{ count: 3 }]);

    const result = await view.execute();

    expect(result.subscripcionesActivas).toBe(10);
  });

  it('should return subscripciones por vencer count', async () => {
    mockExecute
      .mockResolvedValueOnce([{ count: 15 }])
      .mockResolvedValueOnce([{ count: 10 }])
      .mockResolvedValueOnce([{ count: 3 }]);

    const result = await view.execute();

    expect(result.subscripcionesPorVencer).toBe(3);
  });

  it('should return zeros when no data', async () => {
    mockExecute.mockResolvedValue([{ count: 0 }]);

    const result = await view.execute();

    expect(result).toEqual({
      estudiosActivos: 0,
      subscripcionesActivas: 0,
      subscripcionesPorVencer: 0,
    });
  });

  it('should query for active estudios', async () => {
    await view.execute();

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('is_active = true'),
    );
  });

  it('should query for ACTIVA subscripciones', async () => {
    await view.execute();

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining("es.codigo = 'ACTIVA'"),
    );
  });

  it('should query for subscripciones expiring within 30 days', async () => {
    await view.execute();

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining("INTERVAL '30 days'"),
    );
  });
});
