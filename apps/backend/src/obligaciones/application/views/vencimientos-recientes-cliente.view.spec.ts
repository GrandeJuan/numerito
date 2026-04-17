import { VencimientosRecientesClienteView } from './vencimientos-recientes-cliente.view';

describe('VencimientosRecientesClienteView', () => {
  let view: VencimientosRecientesClienteView;
  let mockExecute: jest.Mock;
  let mockEm: any;

  beforeEach(() => {
    mockExecute = jest.fn().mockResolvedValue([]);
    mockEm = {
      getConnection: jest.fn().mockReturnValue({ execute: mockExecute }),
    };
    view = new VencimientosRecientesClienteView(mockEm);
  });

  it('should return recent vencimientos for a cliente', async () => {
    mockExecute.mockResolvedValue([
      { id: 'v-1', obligacion: 'IVA', fecha: '2026-04-15', estado: 'Pendiente' },
      { id: 'v-2', obligacion: 'IIBB', fecha: '2026-04-10', estado: 'Presentado' },
    ]);

    const result = await view.execute({ clienteId: 'cliente-1' });

    expect(result).toEqual([
      { id: 'v-1', obligacion: 'IVA', fecha: '2026-04-15', estado: 'Pendiente' },
      { id: 'v-2', obligacion: 'IIBB', fecha: '2026-04-10', estado: 'Presentado' },
    ]);
  });

  it('should filter by clienteId', async () => {
    await view.execute({ clienteId: 'cliente-42' });

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('v.cliente_id = ?'),
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

  it('should order by fecha_vencimiento DESC', async () => {
    await view.execute({ clienteId: 'cliente-1' });

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('ORDER BY v.fecha_vencimiento DESC'),
      expect.any(Array),
    );
  });

  it('should return empty array when no vencimientos exist', async () => {
    const result = await view.execute({ clienteId: 'cliente-empty' });
    expect(result).toEqual([]);
  });
});
