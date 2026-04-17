import { FacturasRecientesClienteView } from './facturas-recientes-cliente.view';

describe('FacturasRecientesClienteView', () => {
  let view: FacturasRecientesClienteView;
  let mockExecute: jest.Mock;
  let mockEm: any;

  beforeEach(() => {
    mockExecute = jest.fn().mockResolvedValue([]);
    mockEm = {
      getConnection: jest.fn().mockReturnValue({ execute: mockExecute }),
    };
    view = new FacturasRecientesClienteView(mockEm);
  });

  it('should return recent facturas for a cliente', async () => {
    mockExecute.mockResolvedValue([
      { id: 'f-1', numero: 'A-0001-00001', monto: '5000', estado: 'Pendiente', fecha: '2026-04-01' },
      { id: 'f-2', numero: 'A-0001-00002', monto: '3000', estado: 'Pagada', fecha: '2026-03-15' },
    ]);

    const result = await view.execute({ clienteId: 'cliente-1' });

    expect(result).toEqual([
      { id: 'f-1', numero: 'A-0001-00001', monto: 5000, estado: 'Pendiente', fecha: '2026-04-01' },
      { id: 'f-2', numero: 'A-0001-00002', monto: 3000, estado: 'Pagada', fecha: '2026-03-15' },
    ]);
  });

  it('should convert monto to number', async () => {
    mockExecute.mockResolvedValue([
      { id: 'f-1', numero: 'A-0001-00001', monto: '12345.67', estado: 'Pendiente', fecha: '2026-04-01' },
    ]);

    const result = await view.execute({ clienteId: 'cliente-1' });

    expect(result[0].monto).toBe(12345.67);
  });

  it('should filter by clienteId', async () => {
    await view.execute({ clienteId: 'cliente-42' });

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('f.cliente_id = ?'),
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

  it('should order by fecha_emision DESC', async () => {
    await view.execute({ clienteId: 'cliente-1' });

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('ORDER BY f.fecha_emision DESC'),
      expect.any(Array),
    );
  });

  it('should return empty array when no facturas exist', async () => {
    const result = await view.execute({ clienteId: 'cliente-empty' });
    expect(result).toEqual([]);
  });
});
