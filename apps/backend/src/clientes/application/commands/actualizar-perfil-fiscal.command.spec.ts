import { ActualizarPerfilFiscalHandler } from './actualizar-perfil-fiscal.command';
import { Cuit } from '../../domain/value-objects/cuit.vo';
import { RazonSocial } from '../../domain/value-objects/razon-social.vo';
import { Cliente } from '../../domain/entities/cliente.entity';
import { JURISDICCION } from '@numerito/shared';
import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';
import type { EventBus } from '../../../shared/domain/event-bus';

const principal: EstudioPrincipal = { estudioId: 'estudio-1', userId: 'user-1', roles: [] };

const makeCliente = (overrides: Partial<{ id: string }> = {}) =>
  Cliente.create(
    {
      cuit: Cuit.create('20-12345678-6'),
      razonSocial: RazonSocial.create('Empresa Test'),
      condicionIva: 'RESPONSABLE_INSCRIPTO',
      tipo: 'PERSONA_JURIDICA',
      regimen: 'GENERAL',
      estudioId: 'estudio-1',
    },
    overrides.id,
  );

describe('ActualizarPerfilFiscal Command', () => {
  let handler: ActualizarPerfilFiscalHandler;
  let mockRepo: any;
  let mockEventBus: EventBus;

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findByCuit: jest.fn(),
      findByResponsableId: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn(),
    };
    mockEventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    };
    handler = new ActualizarPerfilFiscalHandler(mockRepo, mockEventBus);
  });

  it('should update perfil fiscal with inscripciones', async () => {
    const cliente = makeCliente();
    mockRepo.findById.mockResolvedValue(cliente);

    await handler.execute(principal, {
      id: cliente.id,
      inscripciones: [
        { jurisdiccion: JURISDICCION.ARCA, regimen: 'IVA', activa: true, desde: '2024-01-01' },
        { jurisdiccion: JURISDICCION.ARBA, regimen: 'IIBB', activa: true, desde: '2024-03-01' },
      ],
    });

    expect(mockRepo.save).toHaveBeenCalledWith(principal, cliente);
    expect(cliente.inscripciones).toHaveLength(2);
    expect(mockEventBus.publishAll).toHaveBeenCalledTimes(1);
  });

  it('should throw when cliente not found', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(
      handler.execute(principal, {
        id: 'nonexistent',
        inscripciones: [],
      }),
    ).rejects.toThrow('Cliente no encontrado');
  });

  it('should reject duplicate active inscripciones', async () => {
    const cliente = makeCliente();
    mockRepo.findById.mockResolvedValue(cliente);

    await expect(
      handler.execute(principal, {
        id: cliente.id,
        inscripciones: [
          { jurisdiccion: JURISDICCION.ARCA, regimen: 'IVA', activa: true, desde: '2024-01-01' },
          { jurisdiccion: JURISDICCION.ARCA, regimen: 'IVA', activa: true, desde: '2024-06-01' },
        ],
      }),
    ).rejects.toThrow('Ya existe una inscripción activa en ARCA / IVA');

    expect(mockRepo.save).not.toHaveBeenCalled();
    expect(mockEventBus.publishAll).not.toHaveBeenCalled();
  });

  it('should pass principal to repo methods', async () => {
    const cliente = makeCliente();
    mockRepo.findById.mockResolvedValue(cliente);

    await handler.execute(principal, {
      id: cliente.id,
      inscripciones: [
        { jurisdiccion: JURISDICCION.ARCA, regimen: 'IVA', activa: true, desde: '2024-01-01' },
      ],
    });

    expect(mockRepo.findById).toHaveBeenCalledWith(principal, cliente.id);
    expect(mockRepo.save).toHaveBeenCalledWith(principal, cliente);
  });

  it('should publish domain events after save', async () => {
    const cliente = makeCliente();
    mockRepo.findById.mockResolvedValue(cliente);

    await handler.execute(principal, {
      id: cliente.id,
      inscripciones: [
        { jurisdiccion: JURISDICCION.ARCA, regimen: 'IVA', activa: true, desde: '2024-01-01' },
      ],
    });

    expect(mockEventBus.publishAll).toHaveBeenCalledTimes(1);
    const publishedEvents = (mockEventBus.publishAll as jest.Mock).mock.calls[0][0];
    expect(publishedEvents).toHaveLength(1);
    expect(publishedEvents[0].eventName).toBe('clientes.perfil-fiscal-actualizado');
    // Events should be cleared after publish
    expect(cliente.getDomainEvents()).toHaveLength(0);
  });

  it('should allow empty inscripciones', async () => {
    const cliente = makeCliente();
    mockRepo.findById.mockResolvedValue(cliente);

    await handler.execute(principal, {
      id: cliente.id,
      inscripciones: [],
    });

    expect(mockRepo.save).toHaveBeenCalledWith(principal, cliente);
    expect(cliente.inscripciones).toHaveLength(0);
  });
});
