import { ActividadRecienteVencimientosView } from './actividad-reciente-vencimientos.view';

describe('ActividadRecienteVencimientosView', () => {
  let view: ActividadRecienteVencimientosView;
  let mockExecute: jest.Mock;

  const estudioId = 'estudio-uuid';

  beforeEach(() => {
    mockExecute = jest.fn().mockResolvedValue([]);
    const mockEm: any = {
      getConnection: () => ({ execute: mockExecute }),
    };
    view = new ActividadRecienteVencimientosView(mockEm);
  });

  it('should return empty array when no vencimientos exist', async () => {
    const result = await view.execute({ estudioId });

    expect(result).toEqual([]);
  });

  it('should return recent vencimiento activity items', async () => {
    mockExecute.mockResolvedValueOnce([
      { descripcion: 'Vencimiento de Acme SRL', fecha: '2026-04-15 10:00:00' },
      { descripcion: 'Vencimiento de Test SA', fecha: '2026-04-14 09:00:00' },
    ]);

    const result = await view.execute({ estudioId });

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      tipo: 'vencimiento',
      descripcion: 'Vencimiento de Acme SRL',
      fecha: '2026-04-15 10:00:00',
    });
    expect(result[1]).toEqual({
      tipo: 'vencimiento',
      descripcion: 'Vencimiento de Test SA',
      fecha: '2026-04-14 09:00:00',
    });
  });

  it('should default to limit 5', async () => {
    await view.execute({ estudioId });

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('LIMIT ?'),
      [estudioId, 5],
    );
  });

  it('should accept custom limit', async () => {
    await view.execute({ estudioId, limite: 10 });

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('LIMIT ?'),
      [estudioId, 10],
    );
  });

  it('should pass estudioId as parameter', async () => {
    await view.execute({ estudioId });

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('v.estudio_id = ?'),
      [estudioId, 5],
    );
  });

  it('should always set tipo to vencimiento', async () => {
    mockExecute.mockResolvedValueOnce([
      { descripcion: 'Vencimiento de X', fecha: '2026-04-15' },
    ]);

    const result = await view.execute({ estudioId });

    expect(result[0].tipo).toBe('vencimiento');
  });
});
