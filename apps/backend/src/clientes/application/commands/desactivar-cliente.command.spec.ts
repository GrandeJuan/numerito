import { DesactivarClienteHandler } from './desactivar-cliente.command';
import { Cuit } from '../../domain/value-objects/cuit.vo';
import { RazonSocial } from '../../domain/value-objects/razon-social.vo';
import { Cliente } from '../../domain/entities/cliente.entity';
import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';

const principal: EstudioPrincipal = { estudioId: 'estudio-1', userId: 'user-1', roles: [] };

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

describe('DesactivarCliente Command', () => {
  let handler: DesactivarClienteHandler;
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
    handler = new DesactivarClienteHandler(mockRepo);
  });

  it('should deactivate an active cliente', async () => {
    const cliente = makeCliente();
    mockRepo.findById.mockResolvedValue(cliente);

    const result = await handler.execute(principal, { id: 'cliente-1' });

    expect(result.isActive).toBe(false);
    expect(mockRepo.save).toHaveBeenCalledWith(principal, cliente);
  });

  it('should throw when cliente not found', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(
      handler.execute(principal, { id: 'nonexistent' }),
    ).rejects.toThrow('Cliente no encontrado');
    expect(mockRepo.save).not.toHaveBeenCalled();
  });
});
