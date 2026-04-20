import { ClientesController } from './clientes.controller';
import { Cuit } from '../../domain/value-objects/cuit.vo';
import { RazonSocial } from '../../domain/value-objects/razon-social.vo';
import { Cliente } from '../../domain/entities/cliente.entity';
import { CrearClienteHandler } from '../../application/commands/crear-cliente.command';
import { ActualizarClienteHandler } from '../../application/commands/actualizar-cliente.command';
import { DesactivarClienteHandler } from '../../application/commands/desactivar-cliente.command';
import { ActivarClienteHandler } from '../../application/commands/activar-cliente.command';
import { AsignarResponsableHandler } from '../../application/commands/asignar-responsable.command';
import { ActualizarPerfilFiscalHandler } from '../../application/commands/actualizar-perfil-fiscal.command';
import { JURISDICCION } from '@numerito/shared';
import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';
import type { EventBus } from '../../../shared/domain/event-bus';

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

describe('ClientesController', () => {
  let controller: ClientesController;
  let mockClienteRepo: any;
  let crearClienteHandler: CrearClienteHandler;
  let actualizarClienteHandler: ActualizarClienteHandler;
  let desactivarClienteHandler: DesactivarClienteHandler;
  let activarClienteHandler: ActivarClienteHandler;
  let asignarResponsableHandler: AsignarResponsableHandler;
  let actualizarPerfilFiscalHandler: ActualizarPerfilFiscalHandler;
  let mockEventBus: EventBus;

  beforeEach(() => {
    mockClienteRepo = {
      findById: jest.fn(),
      findAll: jest.fn().mockResolvedValue([]),
      findByCuit: jest.fn().mockResolvedValue(null),
      findByResponsableId: jest.fn().mockResolvedValue([]),
      save: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn(),
    };
    crearClienteHandler = new CrearClienteHandler(mockClienteRepo);
    actualizarClienteHandler = new ActualizarClienteHandler(mockClienteRepo);
    desactivarClienteHandler = new DesactivarClienteHandler(mockClienteRepo);
    activarClienteHandler = new ActivarClienteHandler(mockClienteRepo);
    asignarResponsableHandler = new AsignarResponsableHandler(mockClienteRepo);
    mockEventBus = { publish: jest.fn(), publishAll: jest.fn() };
    actualizarPerfilFiscalHandler = new ActualizarPerfilFiscalHandler(mockClienteRepo, mockEventBus);
    controller = new ClientesController(
      mockClienteRepo,
      crearClienteHandler,
      actualizarClienteHandler,
      desactivarClienteHandler,
      activarClienteHandler,
      asignarResponsableHandler,
      actualizarPerfilFiscalHandler,
    );
  });

  describe('list', () => {
    it('should return paginated clientes for estudio', async () => {
      const clientes = [makeCliente(), makeCliente({ cuit: '27-12345678-0' })];
      mockClienteRepo.findAll.mockResolvedValue(clientes);

      const result = await controller.list(principal, 1, 20);
      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(result.meta.page).toBe(1);
    });

    it('should pass principal to repo.findAll', async () => {
      mockClienteRepo.findAll.mockResolvedValue([]);

      await controller.list(principal);
      expect(mockClienteRepo.findAll).toHaveBeenCalledWith(principal);
    });
  });

  describe('summary', () => {
    it('should return total and condicion IVA breakdown', async () => {
      const clientes = [makeCliente(), makeCliente({ cuit: '27-12345678-0' })];
      mockClienteRepo.findAll.mockResolvedValue(clientes);

      const result = await controller.summary(principal);
      expect(result.data.total).toBe(2);
      expect(result.data.porCondicionIva).toBeDefined();
      expect(result.data.porCondicionIva['RESPONSABLE_INSCRIPTO']).toBe(2);
    });

    it('should return empty breakdown when no clientes', async () => {
      mockClienteRepo.findAll.mockResolvedValue([]);

      const result = await controller.summary(principal);
      expect(result.data.total).toBe(0);
      expect(result.data.porCondicionIva).toEqual({});
    });
  });

  describe('getById', () => {
    it('should return a cliente by id', async () => {
      const cliente = makeCliente();
      mockClienteRepo.findById.mockResolvedValue(cliente);

      const result = await controller.getById(principal, cliente.id);
      expect(result).toBeDefined();
    });

    it('should throw when cliente not found', async () => {
      mockClienteRepo.findById.mockResolvedValue(null);

      await expect(controller.getById(principal, 'nonexistent')).rejects.toThrow(
        'Cliente no encontrado',
      );
    });

    it('should pass principal to repo.findById', async () => {
      const cliente = makeCliente();
      mockClienteRepo.findById.mockResolvedValue(cliente);

      await controller.getById(principal, cliente.id);
      expect(mockClienteRepo.findById).toHaveBeenCalledWith(principal, cliente.id);
    });
  });

  describe('create', () => {
    it('should create a new cliente using principal', async () => {
      const dto = {
        cuit: '20-12345678-6',
        razonSocial: 'Nueva Empresa',
        condicionIva: 'RESPONSABLE_INSCRIPTO',
        tipo: 'PERSONA_JURIDICA',
        regimen: 'GENERAL',
      };
      const result = await controller.create(dto, principal);
      expect(result.id).toBeDefined();
      expect(mockClienteRepo.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('update', () => {
    it('should delegate to ActualizarClienteHandler with principal', async () => {
      const cliente = makeCliente();
      mockClienteRepo.findById.mockResolvedValue(cliente);

      const result = await controller.update(principal, cliente.id, {
        razonSocial: 'Nuevo Nombre SRL',
      });
      expect(result.razonSocial.value).toBe('Nuevo Nombre SRL');
      expect(mockClienteRepo.save).toHaveBeenCalledTimes(1);
    });

    it('should throw when cliente not found', async () => {
      mockClienteRepo.findById.mockResolvedValue(null);

      await expect(controller.update(principal, 'bad-id', { razonSocial: 'X' })).rejects.toThrow(
        'Cliente no encontrado',
      );
    });
  });

  describe('deactivate', () => {
    it('should deactivate a cliente', async () => {
      const cliente = makeCliente();
      mockClienteRepo.findById.mockResolvedValue(cliente);

      await controller.deactivate(principal, cliente.id);
      expect(cliente.isActive).toBe(false);
      expect(mockClienteRepo.save).toHaveBeenCalledTimes(1);
    });

    it('should throw when cliente not found', async () => {
      mockClienteRepo.findById.mockResolvedValue(null);

      await expect(controller.deactivate(principal, 'bad-id')).rejects.toThrow(
        'Cliente no encontrado',
      );
    });
  });

  describe('activate', () => {
    it('should activate a cliente', async () => {
      const cliente = makeCliente();
      cliente.deactivate();
      mockClienteRepo.findById.mockResolvedValue(cliente);

      await controller.activate(principal, cliente.id);
      expect(cliente.isActive).toBe(true);
      expect(mockClienteRepo.save).toHaveBeenCalledTimes(1);
    });

    it('should throw when cliente not found', async () => {
      mockClienteRepo.findById.mockResolvedValue(null);

      await expect(controller.activate(principal, 'bad-id')).rejects.toThrow(
        'Cliente no encontrado',
      );
    });
  });

  describe('assignResponsable', () => {
    it('should assign responsable to cliente', async () => {
      const cliente = makeCliente();
      mockClienteRepo.findById.mockResolvedValue(cliente);

      await controller.assignResponsable(principal, cliente.id, { responsableId: 'user-1' });
      expect(cliente.responsableId).toBe('user-1');
      expect(mockClienteRepo.save).toHaveBeenCalledTimes(1);
    });

    it('should throw when cliente not found', async () => {
      mockClienteRepo.findById.mockResolvedValue(null);

      await expect(
        controller.assignResponsable(principal, 'bad-id', { responsableId: 'user-1' }),
      ).rejects.toThrow('Cliente no encontrado');
    });
  });

  describe('updatePerfilFiscal', () => {
    it('should update perfil fiscal and return success', async () => {
      const cliente = makeCliente();
      mockClienteRepo.findById.mockResolvedValue(cliente);

      const result = await controller.updatePerfilFiscal(principal, cliente.id, {
        inscripciones: [
          { jurisdiccion: JURISDICCION.ARCA, regimen: 'IVA', activa: true, desde: '2024-01-01' },
        ],
      });

      expect(result.data.ok).toBe(true);
      expect(mockClienteRepo.save).toHaveBeenCalledTimes(1);
      expect(cliente.inscripciones).toHaveLength(1);
    });

    it('should throw when cliente not found', async () => {
      mockClienteRepo.findById.mockResolvedValue(null);

      await expect(
        controller.updatePerfilFiscal(principal, 'bad-id', { inscripciones: [] }),
      ).rejects.toThrow('Cliente no encontrado');
    });

    it('should reject duplicate active inscripciones', async () => {
      const cliente = makeCliente();
      mockClienteRepo.findById.mockResolvedValue(cliente);

      await expect(
        controller.updatePerfilFiscal(principal, cliente.id, {
          inscripciones: [
            { jurisdiccion: JURISDICCION.ARCA, regimen: 'IVA', activa: true, desde: '2024-01-01' },
            { jurisdiccion: JURISDICCION.ARCA, regimen: 'IVA', activa: true, desde: '2024-06-01' },
          ],
        }),
      ).rejects.toThrow('Ya existe una inscripción activa en ARCA / IVA');
    });
  });
});
