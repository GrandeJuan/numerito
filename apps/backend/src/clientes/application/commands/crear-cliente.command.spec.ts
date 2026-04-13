import { CrearClienteHandler } from './crear-cliente.command';
import { CONDICION_IVA, TIPO_CLIENTE, REGIMEN } from '@numerito/shared';

describe('CrearCliente Command', () => {
  let handler: CrearClienteHandler;
  let mockRepo: any;
  let context: { estudioId?: string };

  beforeEach(() => {
    mockRepo = {
      findByCuit: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
      findByResponsableId: jest.fn(),
    };
    context = { estudioId: 'estudio-1' };
    handler = new CrearClienteHandler(mockRepo, context);
  });

  it('should create a new cliente', async () => {
    const result = await handler.execute({
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
      handler.execute({
        cuit: '20-12345678-6',
        razonSocial: 'Test S.A.',
        condicionIva: CONDICION_IVA.RESPONSABLE_INSCRIPTO,
        tipo: TIPO_CLIENTE.PERSONA_JURIDICA,
        regimen: REGIMEN.GENERAL,
      }),
    ).rejects.toThrow('CUIT ya registrado en este estudio');
  });

  it('should throw if tenant context is not available', async () => {
    context.estudioId = undefined;

    await expect(
      handler.execute({
        cuit: '20-12345678-6',
        razonSocial: 'Test S.A.',
        condicionIva: CONDICION_IVA.RESPONSABLE_INSCRIPTO,
        tipo: TIPO_CLIENTE.PERSONA_JURIDICA,
        regimen: REGIMEN.GENERAL,
      }),
    ).rejects.toThrow('Tenant context not available');
  });
});
