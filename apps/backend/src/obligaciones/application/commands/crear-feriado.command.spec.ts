import { CrearFeriadoHandler } from './crear-feriado.command';
import { DiaFeriado, TIPO_FERIADO } from '../../domain/entities/dia-feriado.entity';
import type { FeriadoRepository } from '../../domain/repositories/feriado.repository';

function createMockRepo(): jest.Mocked<FeriadoRepository> {
  return {
    findById: jest.fn(),
    findAll: jest.fn(),
    findByFecha: jest.fn(),
    findByRango: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };
}

describe('CrearFeriadoHandler', () => {
  let repo: jest.Mocked<FeriadoRepository>;
  let handler: CrearFeriadoHandler;

  beforeEach(() => {
    repo = createMockRepo();
    handler = new CrearFeriadoHandler(repo);
  });

  it('should create a NACIONAL feriado and return its id', async () => {
    const result = await handler.execute({
      fecha: '2026-05-01',
      tipo: 'NACIONAL',
      descripcion: 'Día del Trabajador',
    });

    expect(result.id).toBeDefined();
    expect(repo.save).toHaveBeenCalledTimes(1);

    const saved = repo.save.mock.calls[0][0];
    expect(saved).toBeInstanceOf(DiaFeriado);
    expect(saved.fecha).toEqual(new Date('2026-05-01'));
    expect(saved.tipo).toBe(TIPO_FERIADO.NACIONAL);
    expect(saved.descripcion).toBe('Día del Trabajador');
    expect(saved.jurisdiccionAfectada).toBeNull();
  });

  it('should create a PROVINCIAL feriado with jurisdiccionAfectada', async () => {
    const result = await handler.execute({
      fecha: '2026-11-10',
      tipo: 'PROVINCIAL',
      descripcion: 'Día de la Tradición',
      jurisdiccionAfectada: 'ARBA',
    });

    expect(result.id).toBeDefined();
    const saved = repo.save.mock.calls[0][0];
    expect(saved.tipo).toBe(TIPO_FERIADO.PROVINCIAL);
    expect(saved.jurisdiccionAfectada).toBe('ARBA');
  });

  it('should create a BANCARIO feriado', async () => {
    await handler.execute({
      fecha: '2026-12-31',
      tipo: 'BANCARIO',
      descripcion: 'Feriado bancario fin de año',
    });

    const saved = repo.save.mock.calls[0][0];
    expect(saved.tipo).toBe(TIPO_FERIADO.BANCARIO);
    expect(saved.jurisdiccionAfectada).toBeNull();
  });

  it('should set jurisdiccionAfectada to null when not provided', async () => {
    await handler.execute({
      fecha: '2026-07-09',
      tipo: 'NACIONAL',
      descripcion: 'Día de la Independencia',
    });

    const saved = repo.save.mock.calls[0][0];
    expect(saved.jurisdiccionAfectada).toBeNull();
  });

  it('should set jurisdiccionAfectada to null when explicitly null', async () => {
    await handler.execute({
      fecha: '2026-07-09',
      tipo: 'NACIONAL',
      descripcion: 'Día de la Independencia',
      jurisdiccionAfectada: null,
    });

    const saved = repo.save.mock.calls[0][0];
    expect(saved.jurisdiccionAfectada).toBeNull();
  });

  it('should parse fecha string as Date', async () => {
    await handler.execute({
      fecha: '2026-06-20',
      tipo: 'NACIONAL',
      descripcion: 'Paso a la Inmortalidad del Gral. Belgrano',
    });

    const saved = repo.save.mock.calls[0][0];
    expect(saved.fecha).toEqual(new Date('2026-06-20'));
  });
});
