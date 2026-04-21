import { ActualizarCatalogoObligacionHandler } from './actualizar-catalogo-obligacion.command';
import { CatalogoObligacion } from '../../domain/entities/catalogo-obligacion.entity';
import type { CatalogoObligacionRepository } from '../../domain/repositories/catalogo-obligacion.repository';
import { RecursoNoEncontradoError } from '../../../shared/domain/exceptions';

function createMockRepo(
  catalogos: CatalogoObligacion[] = [],
): jest.Mocked<CatalogoObligacionRepository> {
  return {
    findById: jest.fn().mockImplementation((id: string) =>
      Promise.resolve(catalogos.find((c) => c.id === id) ?? null),
    ),
    findAll: jest.fn(),
    findByJurisdiccion: jest.fn(),
    findActivos: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };
}

describe('ActualizarCatalogoObligacionHandler', () => {
  it('should throw RecursoNoEncontradoError for unknown ID', async () => {
    const repo = createMockRepo([]);
    const handler = new ActualizarCatalogoObligacionHandler(repo);

    await expect(
      handler.execute({ id: 'non-existent' }),
    ).rejects.toThrow(RecursoNoEncontradoError);
  });

  it('should update nombre', async () => {
    const catalogo = CatalogoObligacion.create({
      nombre: 'IVA Original',
      tipoObligacion: 'IVA' as any,
      jurisdiccion: 'ARCA' as any,
      frecuencia: 'MENSUAL' as any,
    });

    const repo = createMockRepo([catalogo]);
    const handler = new ActualizarCatalogoObligacionHandler(repo);

    const result = await handler.execute({ id: catalogo.id, nombre: 'IVA Actualizado' });

    expect(result.id).toBe(catalogo.id);
    expect(catalogo.nombre).toBe('IVA Actualizado');
    expect(repo.save).toHaveBeenCalledWith(catalogo);
  });

  it('should update activo to false', async () => {
    const catalogo = CatalogoObligacion.create({
      nombre: 'IIBB',
      tipoObligacion: 'IIBB' as any,
      jurisdiccion: 'ARBA' as any,
      frecuencia: 'MENSUAL' as any,
      activo: true,
    });

    const repo = createMockRepo([catalogo]);
    const handler = new ActualizarCatalogoObligacionHandler(repo);

    await handler.execute({ id: catalogo.id, activo: false });

    expect(catalogo.activo).toBe(false);
    expect(repo.save).toHaveBeenCalledTimes(1);
  });

  it('should update activo to true', async () => {
    const catalogo = CatalogoObligacion.create({
      nombre: 'SICOSS',
      tipoObligacion: 'SICOSS' as any,
      jurisdiccion: 'ARCA' as any,
      frecuencia: 'MENSUAL' as any,
      activo: false,
    });

    const repo = createMockRepo([catalogo]);
    const handler = new ActualizarCatalogoObligacionHandler(repo);

    await handler.execute({ id: catalogo.id, activo: true });

    expect(catalogo.activo).toBe(true);
  });

  it('should update both nombre and activo at once', async () => {
    const catalogo = CatalogoObligacion.create({
      nombre: 'Ganancias',
      tipoObligacion: 'GANANCIAS' as any,
      jurisdiccion: 'ARCA' as any,
      frecuencia: 'ANUAL' as any,
      activo: true,
    });

    const repo = createMockRepo([catalogo]);
    const handler = new ActualizarCatalogoObligacionHandler(repo);

    await handler.execute({ id: catalogo.id, nombre: 'Ganancias Personas Humanas', activo: false });

    expect(catalogo.nombre).toBe('Ganancias Personas Humanas');
    expect(catalogo.activo).toBe(false);
  });

  it('should preserve entity ID after update', async () => {
    const catalogo = CatalogoObligacion.create({
      nombre: 'IVA',
      tipoObligacion: 'IVA' as any,
      jurisdiccion: 'ARCA' as any,
      frecuencia: 'MENSUAL' as any,
    });

    const originalId = catalogo.id;
    const repo = createMockRepo([catalogo]);
    const handler = new ActualizarCatalogoObligacionHandler(repo);

    const result = await handler.execute({ id: originalId, nombre: 'IVA Updated' });

    expect(result.id).toBe(originalId);
    expect(catalogo.id).toBe(originalId);
  });

  it('should not call save if entity is not found', async () => {
    const repo = createMockRepo([]);
    const handler = new ActualizarCatalogoObligacionHandler(repo);

    await expect(handler.execute({ id: 'bad-id' })).rejects.toThrow();

    expect(repo.save).not.toHaveBeenCalled();
  });
});
