import { DocumentosRecientesClienteView } from './documentos-recientes-cliente.view';

describe('DocumentosRecientesClienteView', () => {
  let view: DocumentosRecientesClienteView;
  let mockExecute: jest.Mock;
  let mockEm: any;

  beforeEach(() => {
    mockExecute = jest.fn().mockResolvedValue([]);
    mockEm = {
      getConnection: jest.fn().mockReturnValue({ execute: mockExecute }),
    };
    view = new DocumentosRecientesClienteView(mockEm);
  });

  it('should return recent documentos for a cliente', async () => {
    mockExecute.mockResolvedValue([
      { id: 'd-1', nombre: 'Balance.pdf', tipo: 'PDF', fecha: '2026-04-01' },
      { id: 'd-2', nombre: 'DDJJ.xlsx', tipo: 'XLSX', fecha: '2026-03-20' },
    ]);

    const result = await view.execute({ clienteId: 'cliente-1' });

    expect(result).toEqual([
      { id: 'd-1', nombre: 'Balance.pdf', tipo: 'PDF', fecha: '2026-04-01' },
      { id: 'd-2', nombre: 'DDJJ.xlsx', tipo: 'XLSX', fecha: '2026-03-20' },
    ]);
  });

  it('should filter by clienteId', async () => {
    await view.execute({ clienteId: 'cliente-42' });

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('d.cliente_id = ?'),
      expect.arrayContaining(['cliente-42']),
    );
  });

  it('should default to limit 5', async () => {
    await view.execute({ clienteId: 'cliente-1' });

    expect(mockExecute).toHaveBeenCalledWith(
      expect.any(String),
      expect.arrayContaining([5]),
    );
  });

  it('should accept custom limite', async () => {
    await view.execute({ clienteId: 'cliente-1', limite: 10 });

    expect(mockExecute).toHaveBeenCalledWith(
      expect.any(String),
      expect.arrayContaining([10]),
    );
  });

  it('should order by created_at DESC', async () => {
    await view.execute({ clienteId: 'cliente-1' });

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('ORDER BY d.created_at DESC'),
      expect.any(Array),
    );
  });

  it('should return empty array when no documentos exist', async () => {
    const result = await view.execute({ clienteId: 'cliente-empty' });
    expect(result).toEqual([]);
  });
});
