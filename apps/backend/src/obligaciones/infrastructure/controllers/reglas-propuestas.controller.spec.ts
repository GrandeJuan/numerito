import { ReglasPropuestasController } from './reglas-propuestas.controller';
import type { AprobarReglaPropuestaHandler } from '../../application/commands/aprobar-regla-propuesta.command';
import type { RechazarReglaPropuestaHandler } from '../../application/commands/rechazar-regla-propuesta.command';
import type { AprobarReglasBloqueHandler } from '../../application/commands/aprobar-reglas-bloque.command';
import type { ReglasPropuestasListHandler } from '../../application/queries/reglas-propuestas-list.query';

function createController() {
  const aprobar = { execute: jest.fn().mockResolvedValue({ id: '1' }) } as unknown as jest.Mocked<AprobarReglaPropuestaHandler>;
  const rechazar = { execute: jest.fn().mockResolvedValue({ id: '1' }) } as unknown as jest.Mocked<RechazarReglaPropuestaHandler>;
  const bloque = {
    execute: jest.fn().mockResolvedValue({ aprobadas: ['1', '2'], errores: [] }),
  } as unknown as jest.Mocked<AprobarReglasBloqueHandler>;
  const list = { execute: jest.fn().mockResolvedValue([]) } as unknown as jest.Mocked<ReglasPropuestasListHandler>;

  const controller = new ReglasPropuestasController(aprobar, rechazar, bloque, list);

  return { controller, aprobar, rechazar, bloque, list };
}

describe('ReglasPropuestasController', () => {
  it('should list propuestas', async () => {
    const { controller, list } = createController();
    const result = await controller.list();
    expect(list.execute).toHaveBeenCalledWith(undefined);
    expect(result).toHaveProperty('data');
  });

  it('should aprobar a single propuesta', async () => {
    const { controller, aprobar } = createController();
    const result = await controller.aprobar('42');
    expect(aprobar.execute).toHaveBeenCalledWith({ reglaId: '42' });
    expect(result).toHaveProperty('data');
  });

  it('should rechazar a single propuesta', async () => {
    const { controller, rechazar } = createController();
    const result = await controller.rechazar('42');
    expect(rechazar.execute).toHaveBeenCalledWith({ reglaId: '42' });
    expect(result).toHaveProperty('data');
  });

  it('should aprobar en bloque', async () => {
    const { controller, bloque } = createController();
    const result = await controller.aprobarBloque({ reglaIds: ['1', '2'] });
    expect(bloque.execute).toHaveBeenCalledWith({ reglaIds: ['1', '2'] });
    expect(result).toHaveProperty('data');
  });

  it('should propagate errors from handlers', async () => {
    const { controller, aprobar } = createController();
    (aprobar as any).execute.mockRejectedValue(new Error('not found'));
    await expect(controller.aprobar('99')).rejects.toThrow('not found');
  });
});
