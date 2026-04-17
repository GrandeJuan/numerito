import { ProximosVencimientosDetalleView } from './proximos-vencimientos-detalle.view';

describe('ProximosVencimientosDetalleView', () => {
  let view: ProximosVencimientosDetalleView;
  let mockExecute: jest.Mock;
  let mockEm: any;

  beforeEach(() => {
    mockExecute = jest.fn().mockResolvedValue([]);
    mockEm = {
      getConnection: jest.fn().mockReturnValue({ execute: mockExecute }),
    };
    view = new ProximosVencimientosDetalleView(mockEm);
  });

  it('should return upcoming vencimientos with detail', async () => {
    mockExecute.mockResolvedValue([
      { id: 'v-1', cliente: 'Acme SA', obligacion: 'IVA', fecha: '2026-05-01', estado: 'PENDIENTE' },
      { id: 'v-2', cliente: 'Beta SRL', obligacion: 'IIBB', fecha: '2026-05-05', estado: 'PENDIENTE' },
    ]);

    const result = await view.execute({ estudioId: 'estudio-1' });

    expect(result).toEqual([
      { id: 'v-1', cliente: 'Acme SA', obligacion: 'IVA', fecha: '2026-05-01', estado: 'PENDIENTE' },
      { id: 'v-2', cliente: 'Beta SRL', obligacion: 'IIBB', fecha: '2026-05-05', estado: 'PENDIENTE' },
    ]);
  });

  it('should filter by estudioId', async () => {
    await view.execute({ estudioId: 'estudio-1' });

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('v.estudio_id = ?'),
      expect.arrayContaining(['estudio-1']),
    );
  });

  it('should default to limit 5', async () => {
    await view.execute({ estudioId: 'estudio-1' });

    expect(mockExecute).toHaveBeenCalledWith(
      expect.any(String),
      expect.arrayContaining([5]),
    );
  });

  it('should accept custom limite', async () => {
    await view.execute({ estudioId: 'estudio-1', limite: 10 });

    expect(mockExecute).toHaveBeenCalledWith(
      expect.any(String),
      expect.arrayContaining([10]),
    );
  });

  it('should return empty array when no upcoming vencimientos', async () => {
    const result = await view.execute({ estudioId: 'estudio-empty' });
    expect(result).toEqual([]);
  });
});
