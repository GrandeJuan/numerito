import { VencimientosPendientesClienteView } from './vencimientos-pendientes-cliente.view';

describe('VencimientosPendientesClienteView', () => {
  let view: VencimientosPendientesClienteView;
  let mockEm: any;

  beforeEach(() => {
    mockEm = {
      count: jest.fn().mockResolvedValue(0),
    };
    view = new VencimientosPendientesClienteView(mockEm);
  });

  it('should return totalVencimientosPendientes count for the given cliente', async () => {
    mockEm.count.mockResolvedValue(5);

    const result = await view.execute({ clienteId: 'cliente-1' });

    expect(result).toEqual({ totalVencimientosPendientes: 5 });
    expect(mockEm.count).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        cliente: 'cliente-1',
        estado: { nombre: 'Pendiente' },
      }),
    );
  });

  it('should filter by cliente', async () => {
    mockEm.count.mockResolvedValue(0);

    await view.execute({ clienteId: 'cliente-42' });

    const filter = mockEm.count.mock.calls[0][1];
    expect(filter.cliente).toBe('cliente-42');
  });

  it('should filter by estado Pendiente', async () => {
    mockEm.count.mockResolvedValue(0);

    await view.execute({ clienteId: 'cliente-1' });

    const filter = mockEm.count.mock.calls[0][1];
    expect(filter.estado).toEqual({ nombre: 'Pendiente' });
  });

  it('should return zero when no vencimientos match', async () => {
    mockEm.count.mockResolvedValue(0);

    const result = await view.execute({ clienteId: 'cliente-empty' });

    expect(result).toEqual({ totalVencimientosPendientes: 0 });
  });
});
