import { EliminarFeriadoHandler } from './eliminar-feriado.command';
import { DiaFeriado, TIPO_FERIADO } from '../../domain/entities/dia-feriado.entity';
import type { FeriadoRepository } from '../../domain/repositories/feriado.repository';
import { RecursoNoEncontradoError } from '../../../shared/domain/exceptions';

function createMockRepo(feriados: DiaFeriado[] = []): jest.Mocked<FeriadoRepository> {
  return {
    findById: jest
      .fn()
      .mockImplementation((id: string) =>
        Promise.resolve(feriados.find((f) => f.id === id) ?? null),
      ),
    findAll: jest.fn(),
    findByFecha: jest.fn(),
    findByRango: jest.fn(),
    findByFechaAsSummary: jest.fn(),
    createFromScrape: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };
}

describe('EliminarFeriadoHandler', () => {
  it('should delete an existing feriado', async () => {
    const feriado = DiaFeriado.create({
      fecha: new Date('2026-05-01'),
      tipo: TIPO_FERIADO.NACIONAL,
      descripcion: 'Día del Trabajador',
    });
    const repo = createMockRepo([feriado]);
    const handler = new EliminarFeriadoHandler(repo);

    await handler.execute({ id: feriado.id });

    expect(repo.delete).toHaveBeenCalledTimes(1);
    expect(repo.delete).toHaveBeenCalledWith(feriado);
  });

  it('should throw RecursoNoEncontradoError for unknown ID', async () => {
    const repo = createMockRepo([]);
    const handler = new EliminarFeriadoHandler(repo);

    await expect(handler.execute({ id: 'non-existent' })).rejects.toThrow(RecursoNoEncontradoError);
  });

  it('should not call delete when feriado not found', async () => {
    const repo = createMockRepo([]);
    const handler = new EliminarFeriadoHandler(repo);

    try {
      await handler.execute({ id: 'non-existent' });
    } catch {
      // expected
    }

    expect(repo.delete).not.toHaveBeenCalled();
  });

  it('should look up feriado by the provided ID', async () => {
    const feriado = DiaFeriado.create({
      fecha: new Date('2026-12-25'),
      tipo: TIPO_FERIADO.NACIONAL,
      descripcion: 'Navidad',
    });
    const repo = createMockRepo([feriado]);
    const handler = new EliminarFeriadoHandler(repo);

    await handler.execute({ id: feriado.id });

    expect(repo.findById).toHaveBeenCalledWith(feriado.id);
  });
});
