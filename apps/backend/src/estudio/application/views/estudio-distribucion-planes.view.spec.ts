import { EstudioDistribucionPlanesView } from './estudio-distribucion-planes.view';

describe('EstudioDistribucionPlanesView', () => {
  let view: EstudioDistribucionPlanesView;
  let mockExecute: jest.Mock;

  beforeEach(() => {
    mockExecute = jest.fn().mockResolvedValue([]);
    const mockEm: any = {
      getConnection: jest.fn().mockReturnValue({ execute: mockExecute }),
    };
    view = new EstudioDistribucionPlanesView(mockEm);
  });

  it('should return plan distribution', async () => {
    mockExecute.mockResolvedValue([
      { plan: 'Profesional', cantidad: '15' },
      { plan: 'Enterprise', cantidad: '5' },
    ]);

    const result = await view.execute();

    expect(result).toEqual([
      { plan: 'Profesional', cantidad: 15 },
      { plan: 'Enterprise', cantidad: 5 },
    ]);
  });

  it('should return empty array when no active estudios', async () => {
    const result = await view.execute();

    expect(result).toEqual([]);
  });

  it('should only count active estudios', async () => {
    await view.execute();

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('is_active = true'),
    );
  });

  it('should order by cantidad descending', async () => {
    await view.execute();

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('ORDER BY cantidad DESC'),
    );
  });

  it('should convert cantidad to number', async () => {
    mockExecute.mockResolvedValue([{ plan: 'Trial', cantidad: '3' }]);

    const result = await view.execute();

    expect(typeof result[0].cantidad).toBe('number');
  });
});
