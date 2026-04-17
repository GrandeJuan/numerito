import { EstudioRegistrosRecientesView } from './estudio-registros-recientes.view';

describe('EstudioRegistrosRecientesView', () => {
  let view: EstudioRegistrosRecientesView;
  let mockExecute: jest.Mock;

  beforeEach(() => {
    mockExecute = jest.fn().mockResolvedValue([]);
    const mockEm: any = {
      getConnection: () => ({ execute: mockExecute }),
    };
    view = new EstudioRegistrosRecientesView(mockEm);
  });

  it('should return empty array when no estudios exist', async () => {
    const result = await view.execute();

    expect(result).toEqual([]);
  });

  it('should return recent registrations with email and formatted date', async () => {
    mockExecute.mockResolvedValueOnce([
      { id: 'e1', nombre: 'Nuevo Estudio', plan: 'Trial', email: 'admin@test.com', created_at: '2026-04-10T00:00:00Z' },
      { id: 'e2', nombre: 'Otro Estudio', plan: 'Pro', email: 'owner@test.com', created_at: '2026-04-08T12:30:00Z' },
    ]);

    const result = await view.execute();

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      id: 'e1',
      nombre: 'Nuevo Estudio',
      plan: 'Trial',
      email: 'admin@test.com',
      creadoEn: '2026-04-10',
    });
    expect(result[1].creadoEn).toBe('2026-04-08');
  });

  it('should default email to empty string when null', async () => {
    mockExecute.mockResolvedValueOnce([
      { id: 'e1', nombre: 'Sin Owner', plan: 'Basic', email: null, created_at: '2026-04-01T00:00:00Z' },
    ]);

    const result = await view.execute();

    expect(result[0].email).toBe('');
  });

  it('should default to limit 5', async () => {
    await view.execute();

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('LIMIT ?'),
      [5],
    );
  });

  it('should accept custom limit', async () => {
    await view.execute({ limite: 10 });

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('LIMIT ?'),
      [10],
    );
  });
});
