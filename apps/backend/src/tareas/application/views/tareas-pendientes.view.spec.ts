import { TareasPendientesView } from './tareas-pendientes.view';

describe('TareasPendientesView', () => {
  let view: TareasPendientesView;
  let mockEm: any;

  beforeEach(() => {
    mockEm = {
      count: jest.fn().mockResolvedValue(0),
    };
    view = new TareasPendientesView(mockEm);
  });

  it('should return totalTareasPendientes count for the given estudio', async () => {
    mockEm.count.mockResolvedValue(9);

    const result = await view.execute({ estudioId: 'estudio-1' });

    expect(result).toEqual({ totalTareasPendientes: 9 });
    expect(mockEm.count).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        estudio: 'estudio-1',
        estado: { codigo: { $nin: ['COMPLETADA', 'CANCELADA'] } },
      }),
    );
  });

  it('should apply responsable filter when responsableId is provided', async () => {
    mockEm.count.mockResolvedValue(3);

    const result = await view.execute({
      estudioId: 'estudio-1',
      responsableId: 'user-42',
    });

    expect(result).toEqual({ totalTareasPendientes: 3 });
    expect(mockEm.count).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        estudio: 'estudio-1',
        responsable: 'user-42',
        estado: { codigo: { $nin: ['COMPLETADA', 'CANCELADA'] } },
      }),
    );
  });

  it('should not include responsable filter when responsableId is undefined', async () => {
    mockEm.count.mockResolvedValue(0);

    await view.execute({ estudioId: 'estudio-1' });

    const filter = mockEm.count.mock.calls[0][1];
    expect(filter).not.toHaveProperty('responsable');
  });

  it('should exclude COMPLETADA and CANCELADA estados', async () => {
    mockEm.count.mockResolvedValue(4);

    await view.execute({ estudioId: 'estudio-1' });

    const filter = mockEm.count.mock.calls[0][1];
    expect(filter.estado).toEqual({ codigo: { $nin: ['COMPLETADA', 'CANCELADA'] } });
  });

  it('should filter by estudio tenant', async () => {
    mockEm.count.mockResolvedValue(0);

    await view.execute({ estudioId: 'estudio-42' });

    const filter = mockEm.count.mock.calls[0][1];
    expect(filter.estudio).toBe('estudio-42');
  });

  it('should return zero when no tareas match', async () => {
    mockEm.count.mockResolvedValue(0);

    const result = await view.execute({ estudioId: 'estudio-empty' });

    expect(result).toEqual({ totalTareasPendientes: 0 });
  });
});
