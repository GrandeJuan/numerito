import { FacturasPendientesClienteView } from './facturas-pendientes-cliente.view';

describe('FacturasPendientesClienteView', () => {
  let view: FacturasPendientesClienteView;
  let mockEm: any;

  beforeEach(() => {
    mockEm = {
      count: jest.fn().mockResolvedValue(0),
    };
    view = new FacturasPendientesClienteView(mockEm);
  });

  it('should return totalFacturasPendientes count for the given cliente', async () => {
    mockEm.count.mockResolvedValue(3);

    const result = await view.execute({ clienteId: 'cliente-1' });

    expect(result).toEqual({ totalFacturasPendientes: 3 });
    expect(mockEm.count).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        cliente: 'cliente-1',
        estado: { nombre: { $nin: ['Pagada', 'Anulada'] } },
      }),
    );
  });

  it('should filter by cliente', async () => {
    mockEm.count.mockResolvedValue(0);

    await view.execute({ clienteId: 'cliente-42' });

    const filter = mockEm.count.mock.calls[0][1];
    expect(filter.cliente).toBe('cliente-42');
  });

  it('should exclude Pagada and Anulada estados', async () => {
    mockEm.count.mockResolvedValue(0);

    await view.execute({ clienteId: 'cliente-1' });

    const filter = mockEm.count.mock.calls[0][1];
    expect(filter.estado).toEqual({ nombre: { $nin: ['Pagada', 'Anulada'] } });
  });

  it('should return zero when no facturas match', async () => {
    mockEm.count.mockResolvedValue(0);

    const result = await view.execute({ clienteId: 'cliente-empty' });

    expect(result).toEqual({ totalFacturasPendientes: 0 });
  });
});
