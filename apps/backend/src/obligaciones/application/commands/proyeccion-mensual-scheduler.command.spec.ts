import { ProyeccionMensualScheduler } from './proyeccion-mensual-scheduler.command';
import type { EstudioRepository } from '../../../estudio/domain/repositories/estudio.repository';
import type { ProyectarCalendarioMasivoHandler, ProyectarCalendarioMasivoResult } from './proyectar-calendario-masivo.command';

const makeEstudio = (id: string, nombre: string, isActive = true) => ({
  id,
  nombre: { value: nombre },
  isActive,
  plan: { value: 'BASICO' },
  cuit: '30-11111111-1',
});

const makeResult = (overrides: Partial<ProyectarCalendarioMasivoResult> = {}): ProyectarCalendarioMasivoResult => ({
  clientesProcesados: 3,
  clientesOmitidos: 0,
  totalProyectados: 10,
  errores: [],
  resumenPorCliente: [],
  ...overrides,
});

describe('ProyeccionMensualScheduler', () => {
  let scheduler: ProyeccionMensualScheduler;
  let estudioRepo: jest.Mocked<EstudioRepository>;
  let proyectarMasivoHandler: jest.Mocked<ProyectarCalendarioMasivoHandler>;

  beforeEach(() => {
    estudioRepo = {
      findAll: jest.fn().mockResolvedValue([]),
      findById: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      findByCuit: jest.fn(),
    };
    proyectarMasivoHandler = {
      execute: jest.fn().mockResolvedValue(makeResult()),
    } as any;

    scheduler = new ProyeccionMensualScheduler(estudioRepo, proyectarMasivoHandler);
  });

  it('should project for all active estudios', async () => {
    estudioRepo.findAll.mockResolvedValue([
      makeEstudio('e1', 'Estudio Pini'),
      makeEstudio('e2', 'Estudio Perez'),
    ] as any);

    const result = await scheduler.execute('2026-05');

    expect(proyectarMasivoHandler.execute).toHaveBeenCalledTimes(2);
    expect(result.estudiosActivos).toBe(2);
    expect(result.resultadosPorEstudio).toHaveLength(2);
    expect(result.periodo).toBe('2026-05');
  });

  it('should skip inactive estudios', async () => {
    estudioRepo.findAll.mockResolvedValue([
      makeEstudio('e1', 'Estudio Pini', true),
      makeEstudio('e2', 'Estudio Inactivo', false),
    ] as any);

    const result = await scheduler.execute('2026-05');

    expect(proyectarMasivoHandler.execute).toHaveBeenCalledTimes(1);
    expect(result.estudiosActivos).toBe(1);
  });

  it('should construct system EstudioPrincipal for each estudio', async () => {
    estudioRepo.findAll.mockResolvedValue([
      makeEstudio('e1', 'Estudio Pini'),
    ] as any);

    await scheduler.execute('2026-05');

    const [principal, command] = proyectarMasivoHandler.execute.mock.calls[0];
    expect(principal).toEqual({
      estudioId: 'e1',
      userId: 'system',
      roles: ['SUPERADMIN'],
    });
    expect(command).toEqual({ periodo: '2026-05' });
  });

  it('should use current periodo when none provided', async () => {
    estudioRepo.findAll.mockResolvedValue([
      makeEstudio('e1', 'Estudio Pini'),
    ] as any);

    const result = await scheduler.execute();

    const now = new Date();
    const expectedPeriodo = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    expect(result.periodo).toBe(expectedPeriodo);
  });

  it('should count estudios omitidos when all clients lack inscripciones', async () => {
    estudioRepo.findAll.mockResolvedValue([
      makeEstudio('e1', 'Estudio Sin Clientes'),
    ] as any);
    proyectarMasivoHandler.execute.mockResolvedValue(
      makeResult({ clientesProcesados: 0, clientesOmitidos: 5, totalProyectados: 0 }),
    );

    const result = await scheduler.execute('2026-05');

    expect(result.estudiosOmitidos).toBe(1);
    expect(result.resultadosPorEstudio).toHaveLength(0);
  });

  it('should handle estudio-level errors gracefully', async () => {
    estudioRepo.findAll.mockResolvedValue([
      makeEstudio('e1', 'Estudio Pini'),
      makeEstudio('e2', 'Estudio Roto'),
    ] as any);
    proyectarMasivoHandler.execute
      .mockResolvedValueOnce(makeResult())
      .mockRejectedValueOnce(new Error('DB connection lost'));

    const result = await scheduler.execute('2026-05');

    expect(result.resultadosPorEstudio).toHaveLength(1);
    expect(result.erroresPorEstudio).toHaveLength(1);
    expect(result.erroresPorEstudio[0].estudioNombre).toBe('Estudio Roto');
    expect(result.erroresPorEstudio[0].error).toBe('DB connection lost');
  });

  it('should aggregate totals across estudios', async () => {
    estudioRepo.findAll.mockResolvedValue([
      makeEstudio('e1', 'Estudio A'),
      makeEstudio('e2', 'Estudio B'),
    ] as any);
    proyectarMasivoHandler.execute
      .mockResolvedValueOnce(makeResult({ totalProyectados: 5 }))
      .mockResolvedValueOnce(makeResult({ totalProyectados: 8 }));

    const result = await scheduler.execute('2026-05');

    const total = result.resultadosPorEstudio.reduce((s, r) => s + r.totalProyectados, 0);
    expect(total).toBe(13);
  });
});
