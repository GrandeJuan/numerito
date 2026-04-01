import { CrearClienteHandler } from './crear-cliente.command';
import { CONDICION_IVA } from '@numerito/shared';
import { TIPO_CLIENTE, REGIMEN } from '../../domain/entities/cliente.entity';

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
      findByTenantId: jest.fn(),
      findByResponsableId: jest.fn(),
    };
    handler = new CrearClienteHandler(mockRepo);
  });

  it('should create a new cliente', async () => {
    const result = await handler.execute({
      cuit: '20-12345678-6',
      razonSocial: 'Test S.A.',
      condicionIva: CONDICION_IVA.RESPONSABLE_INSCRIPTO,
      tipo: TIPO_CLIENTE.PERSONA_JURIDICA,
      regimen: REGIMEN.GENERAL,
      tenantId: 'tenant-1',
    });

    expect(result.id).toBeDefined();
    expect(mockRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should throw if CUIT already exists in tenant', async () => {
    mockRepo.findByCuit.mockResolvedValue({ id: 'existing' });

    await expect(
      handler.execute({
        cuit: '20-12345678-6',
        razonSocial: 'Test S.A.',
        condicionIva: CONDICION_IVA.RESPONSABLE_INSCRIPTO,
        tipo: TIPO_CLIENTE.PERSONA_JURIDICA,
        regimen: REGIMEN.GENERAL,
        tenantId: 'tenant-1',
      }),
    ).rejects.toThrow('CUIT ya registrado en este estudio');
  });
});
