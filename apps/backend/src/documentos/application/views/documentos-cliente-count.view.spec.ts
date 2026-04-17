import { DocumentosClienteCountView } from './documentos-cliente-count.view';

describe('DocumentosClienteCountView', () => {
  let view: DocumentosClienteCountView;
  let mockEm: any;

  beforeEach(() => {
    mockEm = {
      count: jest.fn().mockResolvedValue(0),
    };
    view = new DocumentosClienteCountView(mockEm);
  });

  it('should return totalDocumentos count for the given cliente', async () => {
    mockEm.count.mockResolvedValue(10);

    const result = await view.execute({ clienteId: 'cliente-1' });

    expect(result).toEqual({ totalDocumentos: 10 });
    expect(mockEm.count).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        cliente: 'cliente-1',
      }),
    );
  });

  it('should filter by cliente', async () => {
    mockEm.count.mockResolvedValue(0);

    await view.execute({ clienteId: 'cliente-42' });

    const filter = mockEm.count.mock.calls[0][1];
    expect(filter.cliente).toBe('cliente-42');
  });

  it('should return zero when no documentos match', async () => {
    mockEm.count.mockResolvedValue(0);

    const result = await view.execute({ clienteId: 'cliente-empty' });

    expect(result).toEqual({ totalDocumentos: 0 });
  });
});
