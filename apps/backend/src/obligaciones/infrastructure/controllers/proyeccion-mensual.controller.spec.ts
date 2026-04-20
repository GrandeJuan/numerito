import { ProyeccionMensualController } from './proyeccion-mensual.controller';
import type { ProyeccionMensualScheduler, ProyeccionMensualResult } from '../../application/commands/proyeccion-mensual-scheduler.command';
import { AdminGuard } from '../../../iam/infrastructure/guards/admin.guard';

describe('ProyeccionMensualController', () => {
  let controller: ProyeccionMensualController;
  let scheduler: jest.Mocked<ProyeccionMensualScheduler>;

  const mockResult: ProyeccionMensualResult = {
    periodo: '2026-05',
    estudiosActivos: 2,
    estudiosOmitidos: 0,
    resultadosPorEstudio: [
      {
        estudioId: 'e1',
        estudioNombre: 'Estudio Pini',
        clientesProcesados: 3,
        totalProyectados: 10,
        errores: 0,
      },
    ],
    erroresPorEstudio: [],
  };

  beforeEach(() => {
    scheduler = {
      execute: jest.fn().mockResolvedValue(mockResult),
    } as any;

    controller = new ProyeccionMensualController(scheduler);
  });

  it('should call scheduler with provided periodo', async () => {
    const result = await controller.ejecutar({ periodo: '2026-06' });

    expect(scheduler.execute).toHaveBeenCalledWith('2026-06');
    expect(result).toEqual({ success: true, data: mockResult });
  });

  it('should call scheduler without periodo when not provided', async () => {
    await controller.ejecutar();

    expect(scheduler.execute).toHaveBeenCalledWith(undefined);
  });

  it('should have AdminGuard applied', () => {
    const guards = Reflect.getMetadata('__guards__', ProyeccionMensualController);
    expect(guards).toContain(AdminGuard);
  });
});
