import { ActualizarConfiguracionIngestaHandler } from './actualizar-configuracion-ingesta.command';
import { ConfiguracionIngesta } from '../../domain/entities/configuracion-ingesta.entity';
import { RecursoNoEncontradoError } from '../../../shared/domain/exceptions';
import type { ConfiguracionIngestaRepository } from '../../domain/repositories/configuracion-ingesta.repository';

function buildConfig(overrides?: Partial<{ habilitado: boolean; cadenciaDias: number }>) {
  return ConfiguracionIngesta.create({
    fuente: 'ARCA',
    habilitado: overrides?.habilitado ?? true,
    cadenciaDias: overrides?.cadenciaDias ?? 7,
  });
}

function buildRepo(config: ConfiguracionIngesta | null = buildConfig()) {
  return {
    findById: jest.fn().mockResolvedValue(config),
    findByFuente: jest.fn(),
    findAll: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  } as unknown as jest.Mocked<ConfiguracionIngestaRepository>;
}

describe('ActualizarConfiguracionIngestaHandler', () => {
  it('should throw RecursoNoEncontradoError when config not found', async () => {
    const repo = buildRepo(null);
    const handler = new ActualizarConfiguracionIngestaHandler(repo);

    await expect(
      handler.execute({ id: 'non-existent' }),
    ).rejects.toThrow(RecursoNoEncontradoError);
  });

  it('should not call save when config not found', async () => {
    const repo = buildRepo(null);
    const handler = new ActualizarConfiguracionIngestaHandler(repo);

    await expect(handler.execute({ id: 'x' })).rejects.toThrow();
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('should update habilitado to false', async () => {
    const config = buildConfig({ habilitado: true });
    const repo = buildRepo(config);
    const handler = new ActualizarConfiguracionIngestaHandler(repo);

    await handler.execute({ id: config.id, habilitado: false });

    expect(config.habilitado).toBe(false);
    expect(repo.save).toHaveBeenCalledWith(config);
  });

  it('should update habilitado to true', async () => {
    const config = buildConfig({ habilitado: false });
    const repo = buildRepo(config);
    const handler = new ActualizarConfiguracionIngestaHandler(repo);

    await handler.execute({ id: config.id, habilitado: true });

    expect(config.habilitado).toBe(true);
    expect(repo.save).toHaveBeenCalledWith(config);
  });

  it('should update cadenciaDias', async () => {
    const config = buildConfig({ cadenciaDias: 7 });
    const repo = buildRepo(config);
    const handler = new ActualizarConfiguracionIngestaHandler(repo);

    await handler.execute({ id: config.id, cadenciaDias: 14 });

    expect(config.cadenciaDias).toBe(14);
    expect(repo.save).toHaveBeenCalledWith(config);
  });

  it('should update both habilitado and cadenciaDias at once', async () => {
    const config = buildConfig({ habilitado: true, cadenciaDias: 7 });
    const repo = buildRepo(config);
    const handler = new ActualizarConfiguracionIngestaHandler(repo);

    await handler.execute({ id: config.id, habilitado: false, cadenciaDias: 30 });

    expect(config.habilitado).toBe(false);
    expect(config.cadenciaDias).toBe(30);
    expect(repo.save).toHaveBeenCalledTimes(1);
  });

  it('should return the entity id', async () => {
    const config = buildConfig();
    const repo = buildRepo(config);
    const handler = new ActualizarConfiguracionIngestaHandler(repo);

    const result = await handler.execute({ id: config.id, habilitado: true });

    expect(result.id).toBe(config.id);
  });

  it('should save even when no fields provided (no-op update)', async () => {
    const config = buildConfig();
    const repo = buildRepo(config);
    const handler = new ActualizarConfiguracionIngestaHandler(repo);

    const result = await handler.execute({ id: config.id });

    expect(result.id).toBe(config.id);
    expect(repo.save).toHaveBeenCalledWith(config);
  });
});
