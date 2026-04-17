import { ActividadRecienteTareasView } from './actividad-reciente-tareas.view';

describe('ActividadRecienteTareasView', () => {
  let view: ActividadRecienteTareasView;
  let mockExecute: jest.Mock;

  const estudioId = 'estudio-uuid';

  beforeEach(() => {
    mockExecute = jest.fn().mockResolvedValue([]);
    const mockEm: any = {
      getConnection: () => ({ execute: mockExecute }),
    };
    view = new ActividadRecienteTareasView(mockEm);
  });

  it('should return empty array when no tareas exist', async () => {
    const result = await view.execute({ estudioId });

    expect(result).toEqual([]);
  });

  it('should return recent tarea activity items', async () => {
    mockExecute.mockResolvedValueOnce([
      { descripcion: 'Tarea "Preparar IVA" actualizada', fecha: '2026-04-15 10:00:00', usuario: 'alice@test.com' },
      { descripcion: 'Tarea "Cerrar mes" actualizada', fecha: '2026-04-14 09:00:00', usuario: null },
    ]);

    const result = await view.execute({ estudioId });

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      tipo: 'tarea',
      descripcion: 'Tarea "Preparar IVA" actualizada',
      fecha: '2026-04-15 10:00:00',
      usuario: 'alice@test.com',
    });
    expect(result[1]).toEqual({
      tipo: 'tarea',
      descripcion: 'Tarea "Cerrar mes" actualizada',
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

  it('should filter by responsableId when provided', async () => {
    const responsableId = 'resp-uuid';
    await view.execute({ estudioId, responsableId });

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('t.responsable_id = ?'),
      [estudioId, responsableId, responsableId, 5],
    );
  });

  it('should not include responsable filter when not provided', async () => {
    await view.execute({ estudioId });

    expect(mockExecute).toHaveBeenCalledWith(
      expect.not.stringContaining('t.responsable_id = ?'),
      expect.any(Array),
    );
  });

  it('should omit usuario field when null', async () => {
    mockExecute.mockResolvedValueOnce([
      { descripcion: 'Tarea "Test" actualizada', fecha: '2026-04-15', usuario: null },
    ]);

    const result = await view.execute({ estudioId });

    expect(result[0]).not.toHaveProperty('usuario');
  });
});
