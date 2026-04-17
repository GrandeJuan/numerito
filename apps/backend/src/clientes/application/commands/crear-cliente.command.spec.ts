import { CrearClienteHandler } from './crear-cliente.command';
import { CONDICION_IVA, TIPO_CLIENTE, REGIMEN } from '@numerito/shared';
import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';

const principal: EstudioPrincipal = { estudioId: 'estudio-1', userId: 'user-1', roles: [] };

describe('CrearCliente Command', () => {
  let handler: CrearClienteHandler;
  let mockRepo: any;

  beforeEach(() => {
    mockRepo = {
      findByCuit: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
      findByResponsableId: jest.fn(),
    };
    handler = new CrearClienteHandler(mockRepo);
  });

  it('should create a new cliente', async () => {
    const result = await handler.execute(principal, {
      cuit: '20-12345678-6',
      razonSocial: 'Test S.A.',
      condicionIva: CONDICION_IVA.RESPONSABLE_INSCRIPTO,
      tipo: TIPO_CLIENTE.PERSONA_JURIDICA,
      regimen: REGIMEN.GENERAL,
    });

    expect(result.id).toBeDefined();
    expect(mockRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should throw if CUIT already exists in estudio', async () => {
    mockRepo.findByCuit.mockResolvedValue({ id: 'existing' });

    await expect(
      handler.execute(principal, {
        cuit: '20-12345678-6',
        razonSocial: 'Test S.A.',
        condicionIva: CONDICION_IVA.RESPONSABLE_INSCRIPTO,
        tipo: TIPO_CLIENTE.PERSONA_JURIDICA,
        regimen: REGIMEN.GENERAL,
      }),
    ).rejects.toThrow('CUIT ya registrado en este estudio');
  });

  it('should use estudioId from principal', async () => {
    const customPrincipal: EstudioPrincipal = { estudioId: 'estudio-99', userId: 'user-1', roles: [] };

    await handler.execute(customPrincipal, {
      cuit: '20-12345678-6',
      razonSocial: 'Test S.A.',
      condicionIva: CONDICION_IVA.RESPONSABLE_INSCRIPTO,
      tipo: TIPO_CLIENTE.PERSONA_JURIDICA,
      regimen: REGIMEN.GENERAL,
    });

    const savedCliente = mockRepo.save.mock.calls[0][1];
    expect(savedCliente.estudioId).toBe('estudio-99');
  });

  it('should pass principal to repo.findByCuit and repo.save', async () => {
    await handler.execute(principal, {
      cuit: '20-12345678-6',
      razonSocial: 'Test S.A.',
      condicionIva: CONDICION_IVA.RESPONSABLE_INSCRIPTO,
      tipo: TIPO_CLIENTE.PERSONA_JURIDICA,
      regimen: REGIMEN.GENERAL,
    });

    expect(mockRepo.findByCuit).toHaveBeenCalledWith(principal, expect.anything());
    expect(mockRepo.save).toHaveBeenCalledWith(principal, expect.anything());
  });
});
