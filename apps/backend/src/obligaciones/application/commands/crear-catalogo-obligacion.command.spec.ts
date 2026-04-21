import { CrearCatalogoObligacionHandler } from './crear-catalogo-obligacion.command';
import { CatalogoObligacion } from '../../domain/entities/catalogo-obligacion.entity';
import type { CatalogoObligacionRepository } from '../../domain/repositories/catalogo-obligacion.repository';

function createMockRepo(): jest.Mocked<CatalogoObligacionRepository> {
  return {
    findById: jest.fn(),
    findAll: jest.fn(),
    findByJurisdiccion: jest.fn(),
    findActivos: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };
}

describe('CrearCatalogoObligacionHandler', () => {
  let repo: jest.Mocked<CatalogoObligacionRepository>;
  let handler: CrearCatalogoObligacionHandler;

  beforeEach(() => {
    repo = createMockRepo();
    handler = new CrearCatalogoObligacionHandler(repo);
  });

  it('should create a catalogo obligacion and return its id', async () => {
    const result = await handler.execute({
      nombre: 'IVA Mensual',
      tipoObligacion: 'IVA',
      jurisdiccion: 'ARCA',
      frecuencia: 'MENSUAL',
    });

    expect(result.id).toBeDefined();
    expect(repo.save).toHaveBeenCalledTimes(1);

    const saved = repo.save.mock.calls[0][0];
    expect(saved).toBeInstanceOf(CatalogoObligacion);
    expect(saved.nombre).toBe('IVA Mensual');
    expect(saved.tipoObligacion).toBe('IVA');
    expect(saved.jurisdiccion).toBe('ARCA');
    expect(saved.frecuencia).toBe('MENSUAL');
  });

  it('should default activo to true when not provided', async () => {
    await handler.execute({
      nombre: 'IIBB Mensual',
      tipoObligacion: 'IIBB',
      jurisdiccion: 'ARBA',
      frecuencia: 'MENSUAL',
    });

    const saved = repo.save.mock.calls[0][0];
    expect(saved.activo).toBe(true);
  });

  it('should respect activo=false when explicitly set', async () => {
    await handler.execute({
      nombre: 'SICOSS',
      tipoObligacion: 'SICOSS',
      jurisdiccion: 'ARCA',
      frecuencia: 'MENSUAL',
      activo: false,
    });

    const saved = repo.save.mock.calls[0][0];
    expect(saved.activo).toBe(false);
  });

  it('should create catalogo with ARBA jurisdiccion', async () => {
    await handler.execute({
      nombre: 'IIBB Buenos Aires',
      tipoObligacion: 'IIBB',
      jurisdiccion: 'ARBA',
      frecuencia: 'MENSUAL',
    });

    const saved = repo.save.mock.calls[0][0];
    expect(saved.jurisdiccion).toBe('ARBA');
  });

  it('should create catalogo with ANUAL frecuencia', async () => {
    await handler.execute({
      nombre: 'Ganancias',
      tipoObligacion: 'GANANCIAS',
      jurisdiccion: 'ARCA',
      frecuencia: 'ANUAL',
    });

    const saved = repo.save.mock.calls[0][0];
    expect(saved.frecuencia).toBe('ANUAL');
  });

  it('should generate unique ids for each catalogo', async () => {
    const result1 = await handler.execute({
      nombre: 'IVA',
      tipoObligacion: 'IVA',
      jurisdiccion: 'ARCA',
      frecuencia: 'MENSUAL',
    });

    const result2 = await handler.execute({
      nombre: 'IIBB',
      tipoObligacion: 'IIBB',
      jurisdiccion: 'ARBA',
      frecuencia: 'MENSUAL',
    });

    expect(result1.id).not.toBe(result2.id);
  });
});
