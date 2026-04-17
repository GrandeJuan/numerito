import { EstudioRecientesAdminView } from './estudio-recientes-admin.view';

describe('EstudioRecientesAdminView', () => {
  let view: EstudioRecientesAdminView;
  let mockExecute: jest.Mock;

  beforeEach(() => {
    mockExecute = jest.fn().mockResolvedValue([]);
    const mockEm: any = {
      getConnection: jest.fn().mockReturnValue({ execute: mockExecute }),
    };
    view = new EstudioRecientesAdminView(mockEm);
  });

  it('should return recent estudios with plan info', async () => {
    mockExecute.mockResolvedValue([
      { id: 'e1', nombre: 'Estudio A', plan: 'Profesional', is_active: true, created_at: '2026-04-10T00:00:00Z' },
    ]);

    const result = await view.execute();

    expect(result).toEqual([
      { id: 'e1', nombre: 'Estudio A', plan: 'Profesional', isActive: true, createdAt: '2026-04-10' },
    ]);
  });

  it('should default to limit 10', async () => {
    await view.execute();

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('LIMIT 10'),
    );
  });

  it('should respect custom limit', async () => {
    await view.execute({ limit: 5 });

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('LIMIT 5'),
    );
  });

  it('should return empty array when no estudios', async () => {
    const result = await view.execute();

    expect(result).toEqual([]);
  });

  it('should format createdAt as YYYY-MM-DD', async () => {
    mockExecute.mockResolvedValue([
      { id: 'e1', nombre: 'Test', plan: 'Trial', is_active: true, created_at: '2026-03-15T14:30:00Z' },
    ]);

    const result = await view.execute();

    expect(result[0].createdAt).toBe('2026-03-15');
  });

  it('should handle null plan as Sin plan', async () => {
    mockExecute.mockResolvedValue([
      { id: 'e1', nombre: 'Test', plan: null, is_active: false, created_at: '2026-04-01T00:00:00Z' },
    ]);

    const result = await view.execute();

    expect(result[0].plan).toBe('Sin plan');
    expect(result[0].isActive).toBe(false);
  });

  it('should order by created_at descending', async () => {
    await view.execute();

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('ORDER BY e.created_at DESC'),
    );
  });
});
