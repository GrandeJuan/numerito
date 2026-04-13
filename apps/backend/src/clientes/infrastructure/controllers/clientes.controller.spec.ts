import { ClientesController } from './clientes.controller';
import { Cuit } from '../../domain/value-objects/cuit.vo';
import { RazonSocial } from '../../domain/value-objects/razon-social.vo';
import { Cliente } from '../../domain/entities/cliente.entity';
import { CrearClienteHandler } from '../../application/commands/crear-cliente.command';

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

  beforeEach(() => {
    mockClienteRepo = {
      findById: jest.fn(),
      findAll: jest.fn().mockResolvedValue([]),
      findByCuit: jest.fn().mockResolvedValue(null),
      findByResponsableId: jest.fn().mockResolvedValue([]),
      save: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn(),
    };
    crearClienteHandler = new CrearClienteHandler(mockClienteRepo, { estudioId: 'estudio-1' });
    controller = new ClientesController(mockClienteRepo, crearClienteHandler);
  });

  describe('list', () => {
    it('should return paginated clientes for estudio', async () => {
      const clientes = [makeCliente(), makeCliente({ cuit: '27-12345678-0' })];
      mockClienteRepo.findAll.mockResolvedValue(clientes);

      const result = await controller.list(1, 20);
      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(result.meta.page).toBe(1);
    });

    it('should use default page and limit when not provided', async () => {
      mockClienteRepo.findAll.mockResolvedValue([]);

      const result = await controller.list();
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
    });
  });

  describe('summary', () => {
    it('should return total and condicion IVA breakdown', async () => {
      const clientes = [makeCliente(), makeCliente({ cuit: '27-12345678-0' })];
      mockClienteRepo.findAll.mockResolvedValue(clientes);

      const result = await controller.summary();
      expect(result.data.total).toBe(2);
      expect(result.data.porCondicionIva).toBeDefined();
      expect(result.data.porCondicionIva['RESPONSABLE_INSCRIPTO']).toBe(2);
    });

    it('should return empty breakdown when no clientes', async () => {
      mockClienteRepo.findAll.mockResolvedValue([]);

      const result = await controller.summary();
      expect(result.data.total).toBe(0);
      expect(result.data.porCondicionIva).toEqual({});
    });
  });

  describe('getById', () => {
    it('should return a cliente by id', async () => {
      const cliente = makeCliente();
      mockClienteRepo.findById.mockResolvedValue(cliente);

      const result = await controller.getById(cliente.id);
      expect(result).toBeDefined();
    });

    it('should throw when cliente not found', async () => {
      mockClienteRepo.findById.mockResolvedValue(null);

      await expect(controller.getById('nonexistent')).rejects.toThrow('Cliente no encontrado');
    });
  });

  describe('create', () => {
    it('should create a new cliente', async () => {
      const dto = {
        cuit: '20-12345678-6',
        razonSocial: 'Nueva Empresa',
        condicionIva: 'RESPONSABLE_INSCRIPTO',
        tipo: 'PERSONA_JURIDICA',
        regimen: 'GENERAL',
      };
      const result = await controller.create(dto);
      expect(result.id).toBeDefined();
      expect(mockClienteRepo.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('update', () => {
    it('should update cliente razonSocial', async () => {
      const cliente = makeCliente();
      mockClienteRepo.findById.mockResolvedValue(cliente);

      await controller.update(cliente.id, { razonSocial: 'Nuevo Nombre SRL' });
      expect(mockClienteRepo.save).toHaveBeenCalledTimes(1);
    });

    it('should throw when cliente not found', async () => {
      mockClienteRepo.findById.mockResolvedValue(null);

      await expect(controller.update('bad-id', { razonSocial: 'X' })).rejects.toThrow(
        'Cliente no encontrado',
      );
    });

    it('should update condicionIva', async () => {
      const cliente = makeCliente();
      mockClienteRepo.findById.mockResolvedValue(cliente);

      await controller.update(cliente.id, { condicionIva: 'MONOTRIBUTO' });
      expect(cliente.condicionIva).toBe('MONOTRIBUTO');
      expect(mockClienteRepo.save).toHaveBeenCalledTimes(1);
    });

    it('should save without changes when dto is empty', async () => {
      const cliente = makeCliente();
      mockClienteRepo.findById.mockResolvedValue(cliente);

      await controller.update(cliente.id, {});
      expect(mockClienteRepo.save).toHaveBeenCalledTimes(1);
    });

    it('should update regimen', async () => {
      const cliente = makeCliente();
      mockClienteRepo.findById.mockResolvedValue(cliente);

      await controller.update(cliente.id, { regimen: 'MONOTRIBUTO' });
      expect(cliente.regimen).toBe('MONOTRIBUTO');
    });
  });

  describe('deactivate', () => {
    it('should deactivate a cliente', async () => {
      const cliente = makeCliente();
      mockClienteRepo.findById.mockResolvedValue(cliente);

      await controller.deactivate(cliente.id);
      expect(cliente.isActive).toBe(false);
      expect(mockClienteRepo.save).toHaveBeenCalledTimes(1);
    });

    it('should throw when cliente not found', async () => {
      mockClienteRepo.findById.mockResolvedValue(null);

      await expect(controller.deactivate('bad-id')).rejects.toThrow('Cliente no encontrado');
    });
  });

  describe('activate', () => {
    it('should activate a cliente', async () => {
      const cliente = makeCliente();
      cliente.deactivate();
      mockClienteRepo.findById.mockResolvedValue(cliente);

      await controller.activate(cliente.id);
      expect(cliente.isActive).toBe(true);
      expect(mockClienteRepo.save).toHaveBeenCalledTimes(1);
    });

    it('should throw when cliente not found', async () => {
      mockClienteRepo.findById.mockResolvedValue(null);

      await expect(controller.activate('bad-id')).rejects.toThrow('Cliente no encontrado');
    });
  });

  describe('assignResponsable', () => {
    it('should assign responsable to cliente', async () => {
      const cliente = makeCliente();
      mockClienteRepo.findById.mockResolvedValue(cliente);

      await controller.assignResponsable(cliente.id, { responsableId: 'user-1' });
      expect(cliente.responsableId).toBe('user-1');
      expect(mockClienteRepo.save).toHaveBeenCalledTimes(1);
    });

    it('should throw when cliente not found', async () => {
      mockClienteRepo.findById.mockResolvedValue(null);

      await expect(
        controller.assignResponsable('bad-id', { responsableId: 'user-1' }),
      ).rejects.toThrow('Cliente no encontrado');
    });
  });
});
