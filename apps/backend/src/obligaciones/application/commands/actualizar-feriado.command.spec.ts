import { ActualizarFeriadoHandler } from './actualizar-feriado.command';
import { DiaFeriado, TIPO_FERIADO } from '../../domain/entities/dia-feriado.entity';
import type { FeriadoRepository } from '../../domain/repositories/feriado.repository';
import { RecursoNoEncontradoError } from '../../../shared/domain/exceptions';

function createMockRepo(feriados: DiaFeriado[] = []): jest.Mocked<FeriadoRepository> {
  return {
    findById: jest.fn().mockImplementation((id: string) =>
      Promise.resolve(feriados.find((f) => f.id === id) ?? null),
    ),
    findAll: jest.fn(),
    findByFecha: jest.fn(),
    findByRango: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };
}

function createFeriado(overrides: Partial<{
  fecha: Date;
  tipo: string;
  descripcion: string;
  jurisdiccionAfectada: string | null;
}> = {}): DiaFeriado {
  return DiaFeriado.create({
    fecha: overrides.fecha ?? new Date('2026-05-01'),
    tipo: (overrides.tipo as any) ?? TIPO_FERIADO.NACIONAL,
    descripcion: overrides.descripcion ?? 'Día del Trabajador',
    jurisdiccionAfectada: overrides.jurisdiccionAfectada ?? null,
  });
}

describe('ActualizarFeriadoHandler', () => {
  it('should throw RecursoNoEncontradoError for unknown ID', async () => {
    const repo = createMockRepo([]);
    const handler = new ActualizarFeriadoHandler(repo);

    await expect(
      handler.execute({ id: 'non-existent', descripcion: 'updated' }),
    ).rejects.toThrow(RecursoNoEncontradoError);
  });

  it('should update descripcion only', async () => {
    const existing = createFeriado();
    const repo = createMockRepo([existing]);
    const handler = new ActualizarFeriadoHandler(repo);

    const result = await handler.execute({
      id: existing.id,
      descripcion: 'Día Internacional del Trabajador',
    });

    expect(result.id).toBe(existing.id);
    const saved = repo.save.mock.calls[0][0];
    expect(saved.descripcion).toBe('Día Internacional del Trabajador');
    expect(saved.fecha).toEqual(new Date('2026-05-01'));
    expect(saved.tipo).toBe(TIPO_FERIADO.NACIONAL);
  });

  it('should update fecha only', async () => {
    const existing = createFeriado();
    const repo = createMockRepo([existing]);
    const handler = new ActualizarFeriadoHandler(repo);

    await handler.execute({ id: existing.id, fecha: '2026-05-02' });

    const saved = repo.save.mock.calls[0][0];
    expect(saved.fecha).toEqual(new Date('2026-05-02'));
    expect(saved.descripcion).toBe('Día del Trabajador');
  });

  it('should update tipo only', async () => {
    const existing = createFeriado();
    const repo = createMockRepo([existing]);
    const handler = new ActualizarFeriadoHandler(repo);

    await handler.execute({ id: existing.id, tipo: 'BANCARIO' });

    const saved = repo.save.mock.calls[0][0];
    expect(saved.tipo).toBe(TIPO_FERIADO.BANCARIO);
  });

  it('should update jurisdiccionAfectada to a value', async () => {
    const existing = createFeriado();
    const repo = createMockRepo([existing]);
    const handler = new ActualizarFeriadoHandler(repo);

    await handler.execute({ id: existing.id, jurisdiccionAfectada: 'ARBA' });

    const saved = repo.save.mock.calls[0][0];
    expect(saved.jurisdiccionAfectada).toBe('ARBA');
  });

  it('should update jurisdiccionAfectada to null', async () => {
    const existing = createFeriado({
      tipo: 'PROVINCIAL',
      jurisdiccionAfectada: 'ARBA',
    });
    const repo = createMockRepo([existing]);
    const handler = new ActualizarFeriadoHandler(repo);

    await handler.execute({ id: existing.id, jurisdiccionAfectada: null });

    const saved = repo.save.mock.calls[0][0];
    expect(saved.jurisdiccionAfectada).toBeNull();
  });

  it('should preserve existing id when updating', async () => {
    const existing = createFeriado();
    const repo = createMockRepo([existing]);
    const handler = new ActualizarFeriadoHandler(repo);

    await handler.execute({
      id: existing.id,
      fecha: '2026-12-25',
      tipo: 'NACIONAL',
      descripcion: 'Navidad',
    });

    const saved = repo.save.mock.calls[0][0];
    expect(saved.id).toBe(existing.id);
  });

  it('should update all fields at once', async () => {
    const existing = createFeriado();
    const repo = createMockRepo([existing]);
    const handler = new ActualizarFeriadoHandler(repo);

    await handler.execute({
      id: existing.id,
      fecha: '2026-11-10',
      tipo: 'PROVINCIAL',
      descripcion: 'Día de la Tradición',
      jurisdiccionAfectada: 'ARBA',
    });

    const saved = repo.save.mock.calls[0][0];
    expect(saved.fecha).toEqual(new Date('2026-11-10'));
    expect(saved.tipo).toBe(TIPO_FERIADO.PROVINCIAL);
    expect(saved.descripcion).toBe('Día de la Tradición');
    expect(saved.jurisdiccionAfectada).toBe('ARBA');
  });
});
