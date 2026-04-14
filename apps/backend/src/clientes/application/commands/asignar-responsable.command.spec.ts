import { AsignarResponsableHandler } from './asignar-responsable.command';
import { Cuit } from '../../domain/value-objects/cuit.vo';
import { RazonSocial } from '../../domain/value-objects/razon-social.vo';
import { Cliente } from '../../domain/entities/cliente.entity';

const makeCliente = (id = 'cliente-1') =>
  Cliente.create(
    {
      cuit: Cuit.create('20-12345678-6'),
      razonSocial: RazonSocial.create('Empresa Test'),
      condicionIva: 'RESPONSABLE_INSCRIPTO',
      tipo: 'PERSONA_JURIDICA',
      regimen: 'GENERAL',
      estudioId: 'estudio-1',
    },
    id,
  );

describe('AsignarResponsable Command', () => {
  let handler: AsignarResponsableHandler;
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
    handler = new AsignarResponsableHandler(mockRepo);
  });

  it('should assign responsable to cliente', async () => {
    const cliente = makeCliente();
    mockRepo.findById.mockResolvedValue(cliente);

    const result = await handler.execute({
      id: 'cliente-1',
      responsableId: 'user-42',
    });

    expect(result.responsableId).toBe('user-42');
    expect(mockRepo.save).toHaveBeenCalledWith(cliente);
  });

  it('should throw when cliente not found', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(
      handler.execute({ id: 'nonexistent', responsableId: 'user-1' }),
    ).rejects.toThrow('Cliente no encontrado');
    expect(mockRepo.save).not.toHaveBeenCalled();
  });
});
