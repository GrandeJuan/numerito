import { ActualizarClienteHandler } from './actualizar-cliente.command';
import { Cuit } from '../../domain/value-objects/cuit.vo';
import { RazonSocial } from '../../domain/value-objects/razon-social.vo';
import { Cliente } from '../../domain/entities/cliente.entity';
import { CONDICION_IVA, REGIMEN } from '@numerito/shared';
import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';

const principal: EstudioPrincipal = { estudioId: 'estudio-1', userId: 'user-1', roles: [] };

const makeCliente = (
  overrides: Partial<{ id: string; cuit: string; razonSocial: string; estudioId: string }> = {},
) =>
  Cliente.create(
    {
      cuit: Cuit.create(overrides.cuit ?? '20-12345678-6'),
      razonSocial: RazonSocial.create(overrides.razonSocial ?? 'Empresa Test'),
      condicionIva: 'RESPONSABLE_INSCRIPTO',
      tipo: 'PERSONA_JURIDICA',
      regimen: 'GENERAL',
      estudioId: overrides.estudioId ?? 'estudio-1',
    },
    overrides.id,
  );

describe('ActualizarCliente Command', () => {
  let handler: ActualizarClienteHandler;
  let mockRepo: any;

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findByCuit: jest.fn(),
      findByResponsableId: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn(),
    };
    handler = new ActualizarClienteHandler(mockRepo);
  });

  it('should update razonSocial', async () => {
    const cliente = makeCliente();
    mockRepo.findById.mockResolvedValue(cliente);

    const result = await handler.execute(principal, {
      id: cliente.id,
      razonSocial: 'Nuevo Nombre SRL',
    });

    expect(result.razonSocial).toBe('Nuevo Nombre SRL');
    expect(mockRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should update condicionIva', async () => {
    const cliente = makeCliente();
    mockRepo.findById.mockResolvedValue(cliente);

    const result = await handler.execute(principal, {
      id: cliente.id,
      condicionIva: CONDICION_IVA.MONOTRIBUTO,
    });

    expect(result.condicionIva).toBe(CONDICION_IVA.MONOTRIBUTO);
    expect(mockRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should update regimen', async () => {
    const cliente = makeCliente();
    mockRepo.findById.mockResolvedValue(cliente);

    const result = await handler.execute(principal, {
      id: cliente.id,
      regimen: REGIMEN.MONOTRIBUTO,
    });

    expect(result.regimen).toBe(REGIMEN.MONOTRIBUTO);
    expect(mockRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should update multiple fields at once', async () => {
    const cliente = makeCliente();
    mockRepo.findById.mockResolvedValue(cliente);

    const result = await handler.execute(principal, {
      id: cliente.id,
      razonSocial: 'Actualizada S.A.',
      condicionIva: CONDICION_IVA.MONOTRIBUTO,
      regimen: REGIMEN.MONOTRIBUTO,
    });

    expect(result.razonSocial).toBe('Actualizada S.A.');
    expect(result.condicionIva).toBe(CONDICION_IVA.MONOTRIBUTO);
    expect(result.regimen).toBe(REGIMEN.MONOTRIBUTO);
  });

  it('should save without changes when command has no fields', async () => {
    const cliente = makeCliente();
    mockRepo.findById.mockResolvedValue(cliente);

    await handler.execute(principal, { id: cliente.id });

    expect(mockRepo.save).toHaveBeenCalledTimes(1);
    expect(cliente.razonSocial).toBe('Empresa Test');
  });

  it('should throw when cliente not found', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(
      handler.execute(principal, { id: 'nonexistent', razonSocial: 'X' }),
    ).rejects.toThrow('Cliente no encontrado');
  });

  it('should pass principal to repo methods', async () => {
    const cliente = makeCliente();
    mockRepo.findById.mockResolvedValue(cliente);

    await handler.execute(principal, { id: cliente.id, razonSocial: 'Nuevo' });

    expect(mockRepo.findById).toHaveBeenCalledWith(principal, cliente.id);
    expect(mockRepo.save).toHaveBeenCalledWith(principal, cliente);
  });
});
