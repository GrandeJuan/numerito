import { FacturacionMesView } from './facturacion-mes.view';

describe('FacturacionMesView', () => {
  let view: FacturacionMesView;
  let mockExecute: jest.Mock;
  let mockEm: any;

  beforeEach(() => {
    mockExecute = jest.fn().mockResolvedValue([{ total: 0 }]);
    mockEm = {
      getConnection: jest.fn().mockReturnValue({ execute: mockExecute }),
    };
    view = new FacturacionMesView(mockEm);
  });

  it('should return total facturacion for current month', async () => {
    mockExecute.mockResolvedValue([{ total: 150000 }]);

    const result = await view.execute({ estudioId: 'estudio-1' });

    expect(result).toEqual({ total: 150000 });
  });

  it('should filter by estudioId', async () => {
    await view.execute({ estudioId: 'estudio-1' });

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('estudio_id = ?'),
      expect.arrayContaining(['estudio-1']),
    );
  });

  it('should return zero when no facturas in current month', async () => {
    mockExecute.mockResolvedValue([{ total: 0 }]);

    const result = await view.execute({ estudioId: 'estudio-empty' });

    expect(result).toEqual({ total: 0 });
  });

  it('should handle null total gracefully', async () => {
    mockExecute.mockResolvedValue([{ total: null }]);

    const result = await view.execute({ estudioId: 'estudio-empty' });

    expect(result).toEqual({ total: 0 });
  });
});
