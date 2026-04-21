import { AprobarReglasBloqueHandler } from './aprobar-reglas-bloque.command';
import type { AprobarReglaPropuestaHandler } from './aprobar-regla-propuesta.command';

function createMockAprobarHandler(): jest.Mocked<AprobarReglaPropuestaHandler> {
  return {
    execute: jest.fn().mockResolvedValue({ id: 'approved' }),
  } as any;
}

describe('AprobarReglasBloqueHandler', () => {
  let aprobarHandler: jest.Mocked<AprobarReglaPropuestaHandler>;
  let handler: AprobarReglasBloqueHandler;

  beforeEach(() => {
    aprobarHandler = createMockAprobarHandler();
    handler = new AprobarReglasBloqueHandler(aprobarHandler);
  });

  it('should approve all rules successfully', async () => {
    const reglaIds = ['regla-1', 'regla-2', 'regla-3'];

    const result = await handler.execute({ reglaIds });

    expect(result.aprobadas).toEqual(['regla-1', 'regla-2', 'regla-3']);
    expect(result.errores).toHaveLength(0);
    expect(aprobarHandler.execute).toHaveBeenCalledTimes(3);
    expect(aprobarHandler.execute).toHaveBeenCalledWith({ reglaId: 'regla-1' });
    expect(aprobarHandler.execute).toHaveBeenCalledWith({ reglaId: 'regla-2' });
    expect(aprobarHandler.execute).toHaveBeenCalledWith({ reglaId: 'regla-3' });
  });

  it('should collect errors for failed approvals', async () => {
    aprobarHandler.execute
      .mockResolvedValueOnce({ id: 'regla-1' })
      .mockRejectedValueOnce(new Error('ReglaVencimiento no encontrado'))
      .mockResolvedValueOnce({ id: 'regla-3' });

    const result = await handler.execute({
      reglaIds: ['regla-1', 'regla-2', 'regla-3'],
    });

    expect(result.aprobadas).toEqual(['regla-1', 'regla-3']);
    expect(result.errores).toHaveLength(1);
    expect(result.errores[0]).toEqual({
      reglaId: 'regla-2',
      error: 'ReglaVencimiento no encontrado',
    });
  });

  it('should return empty arrays for empty input', async () => {
    const result = await handler.execute({ reglaIds: [] });

    expect(result.aprobadas).toEqual([]);
    expect(result.errores).toEqual([]);
    expect(aprobarHandler.execute).not.toHaveBeenCalled();
  });

  it('should handle all approvals failing', async () => {
    aprobarHandler.execute
      .mockRejectedValueOnce(new Error('Error 1'))
      .mockRejectedValueOnce(new Error('Error 2'));

    const result = await handler.execute({
      reglaIds: ['regla-1', 'regla-2'],
    });

    expect(result.aprobadas).toEqual([]);
    expect(result.errores).toHaveLength(2);
    expect(result.errores[0].reglaId).toBe('regla-1');
    expect(result.errores[1].reglaId).toBe('regla-2');
  });

  it('should continue processing after a failure', async () => {
    aprobarHandler.execute
      .mockRejectedValueOnce(new Error('Failed'))
      .mockResolvedValueOnce({ id: 'regla-2' });

    const result = await handler.execute({
      reglaIds: ['regla-1', 'regla-2'],
    });

    expect(result.aprobadas).toEqual(['regla-2']);
    expect(result.errores).toHaveLength(1);
    expect(aprobarHandler.execute).toHaveBeenCalledTimes(2);
  });

  it('should handle single rule approval', async () => {
    const result = await handler.execute({ reglaIds: ['only-one'] });

    expect(result.aprobadas).toEqual(['only-one']);
    expect(result.errores).toHaveLength(0);
    expect(aprobarHandler.execute).toHaveBeenCalledTimes(1);
  });
});
