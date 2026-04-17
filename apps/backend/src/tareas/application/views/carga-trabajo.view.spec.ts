import { CargaTrabajoView } from './carga-trabajo.view';

describe('CargaTrabajoView', () => {
  let view: CargaTrabajoView;
  let mockExecute: jest.Mock;
  let mockEm: any;

  beforeEach(() => {
    mockExecute = jest.fn().mockResolvedValue([]);
    mockEm = {
      getConnection: jest.fn().mockReturnValue({ execute: mockExecute }),
    };
    view = new CargaTrabajoView(mockEm);
  });

  it('should return task load per user', async () => {
    mockExecute.mockResolvedValue([
      { usuario: 'alice@example.com', tareas: 8 },
      { usuario: 'bob@example.com', tareas: 5 },
    ]);

    const result = await view.execute({ estudioId: 'estudio-1' });

    expect(result).toEqual([
      { usuario: 'alice@example.com', tareas: 8 },
      { usuario: 'bob@example.com', tareas: 5 },
    ]);
  });

  it('should filter by estudioId', async () => {
    await view.execute({ estudioId: 'estudio-1' });

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('t.estudio_id = ?'),
      expect.arrayContaining(['estudio-1']),
    );
  });

  it('should exclude completed and cancelled tasks', async () => {
    await view.execute({ estudioId: 'estudio-1' });

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining("NOT IN ('COMPLETADA', 'CANCELADA')"),
      expect.any(Array),
    );
  });

  it('should return empty array when no active tasks', async () => {
    const result = await view.execute({ estudioId: 'estudio-empty' });
    expect(result).toEqual([]);
  });
});
