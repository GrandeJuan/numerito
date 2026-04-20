import { EstudioEquipoView } from './estudio-equipo.view';

describe('EstudioEquipoView', () => {
  let view: EstudioEquipoView;
  let mockEm: any;

  const mockMembers = [
    {
      usuario: {
        id: 'usr-1',
        email: 'juan@estudio.com',
        nombre: 'Juan',
        apellido: 'Perez',
        emailVerified: true,
      },
      estudio: { id: 'est-1' },
      rol: { codigo: 'SOCIO' },
      isActive: true,
      createdAt: new Date('2026-01-15T10:00:00.000Z'),
    },
    {
      usuario: {
        id: 'usr-2',
        email: 'maria@estudio.com',
        nombre: 'Maria',
        apellido: 'Lopez',
        emailVerified: false,
      },
      estudio: { id: 'est-1' },
      rol: { codigo: 'COLABORADOR' },
      isActive: true,
      createdAt: new Date('2026-02-20T14:00:00.000Z'),
    },
  ];

  beforeEach(() => {
    mockEm = {
      find: jest.fn().mockResolvedValue([]),
    };
    view = new EstudioEquipoView(mockEm);
  });

  it('should filter by estudioId and isActive', async () => {
    await view.execute({ estudioId: 'est-1' });

    const where = mockEm.find.mock.calls[0][1];
    expect(where.estudio).toBe('est-1');
    expect(where.isActive).toBe(true);
  });

  it('should populate usuario and rol relations', async () => {
    await view.execute({ estudioId: 'est-1' });

    const options = mockEm.find.mock.calls[0][2];
    expect(options.populate).toEqual(['usuario', 'rol']);
  });

  it('should order by createdAt ASC', async () => {
    await view.execute({ estudioId: 'est-1' });

    const options = mockEm.find.mock.calls[0][2];
    expect(options.orderBy).toEqual({ createdAt: 'ASC' });
  });

  it('should map fields to EquipoMiembroDto correctly', async () => {
    mockEm.find.mockResolvedValue(mockMembers);

    const result = await view.execute({ estudioId: 'est-1' });

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      usuarioId: 'usr-1',
      email: 'juan@estudio.com',
      nombre: 'Juan',
      apellido: 'Perez',
      rol: 'SOCIO',
      verificado: true,
      creadoEl: '2026-01-15T10:00:00.000Z',
    });
    expect(result[1]).toEqual({
      usuarioId: 'usr-2',
      email: 'maria@estudio.com',
      nombre: 'Maria',
      apellido: 'Lopez',
      rol: 'COLABORADOR',
      verificado: false,
      creadoEl: '2026-02-20T14:00:00.000Z',
    });
  });

  it('should handle member without rol gracefully', async () => {
    mockEm.find.mockResolvedValue([{ ...mockMembers[0], rol: null }]);

    const result = await view.execute({ estudioId: 'est-1' });

    expect(result[0].rol).toBe('UNKNOWN');
  });

  it('should return empty array when estudio has no members', async () => {
    mockEm.find.mockResolvedValue([]);

    const result = await view.execute({ estudioId: 'est-no-members' });

    expect(result).toEqual([]);
  });

  it('should isolate results by estudioId (multi-tenant)', async () => {
    await view.execute({ estudioId: 'est-A' });
    await view.execute({ estudioId: 'est-B' });

    expect(mockEm.find.mock.calls[0][1].estudio).toBe('est-A');
    expect(mockEm.find.mock.calls[1][1].estudio).toBe('est-B');
  });
});
