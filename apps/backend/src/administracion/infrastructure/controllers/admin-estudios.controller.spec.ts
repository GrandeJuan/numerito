import { AdminEstudiosController } from './admin-estudios.controller';
import type { AdminEstudiosPaginados } from '../../application/services/admin-estudios.service';

describe('AdminEstudiosController', () => {
  let controller: AdminEstudiosController;
  let mockEstudioRepo: any;
  let mockEstudiosService: any;
  let mockCrearEstudioHandler: any;

  const paginatedResult: AdminEstudiosPaginados = {
    items: [
      {
        id: 'est-1',
        nombre: 'Estudio Demo',
        cuit: '20-12345678-6',
        plan: 'Profesional',
        planCodigo: 'PROFESIONAL',
        isActive: true,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ],
    total: 1,
    page: 1,
    limit: 20,
  };

  const makeEstudio = (overrides: any = {}) => ({
    id: 'est-1',
    nombre: { value: 'Estudio Demo' },
    cuit: '20-12345678-6',
    isActive: true,
    plan: { value: 'PROFESIONAL', maxClientes: 50, maxUsuarios: 5 },
    deactivate: jest.fn().mockImplementation(function (this: any) { this.isActive = false; }),
    activate: jest.fn().mockImplementation(function (this: any) { this.isActive = true; }),
    ...overrides,
  });

  beforeEach(() => {
    mockEstudiosService = {
      list: jest.fn().mockResolvedValue(paginatedResult),
    };
    mockEstudioRepo = {
      findAll: jest.fn().mockResolvedValue([]),
      findById: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockResolvedValue(undefined),
    };
    mockCrearEstudioHandler = {
      execute: jest.fn().mockResolvedValue({
        id: 'new-est-1',
        nombre: 'Nuevo Estudio',
        cuit: '20-99999999-0',
        plan: 'Profesional',
        subscripcionId: 'sub-1',
      }),
    };
    controller = new AdminEstudiosController(mockEstudioRepo, mockEstudiosService, mockCrearEstudioHandler);
  });

  describe('list', () => {
    it('should return paginated estudios', async () => {
      const result = await controller.list({});

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toHaveProperty('nombre', 'Estudio Demo');
      expect(result.meta).toHaveProperty('total', 1);
      expect(result.meta).toHaveProperty('page', 1);
    });

    it('should pass search filter to service', async () => {
      await controller.list({ search: 'demo' });

      expect(mockEstudiosService.list).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'demo' }),
      );
    });

    it('should pass plan filter to service', async () => {
      await controller.list({ plan: 'PROFESIONAL' });

      expect(mockEstudiosService.list).toHaveBeenCalledWith(
        expect.objectContaining({ plan: 'PROFESIONAL' }),
      );
    });

    it('should pass isActive filter to service', async () => {
      await controller.list({ isActive: 'true' });

      expect(mockEstudiosService.list).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: true }),
      );
    });

    it('should pass date range filters to service', async () => {
      await controller.list({ from: '2026-01-01', to: '2026-12-31' });

      expect(mockEstudiosService.list).toHaveBeenCalledWith(
        expect.objectContaining({ from: '2026-01-01', to: '2026-12-31' }),
      );
    });

    it('should pass page and limit to service', async () => {
      await controller.list({ page: '3', limit: '5' });

      expect(mockEstudiosService.list).toHaveBeenCalledWith(
        expect.objectContaining({ page: 3, limit: 5 }),
      );
    });

    it('should map estudio fields correctly', async () => {
      const result = await controller.list({});

      expect(result.data[0]).toEqual({
        id: 'est-1',
        nombre: 'Estudio Demo',
        cuit: '20-12345678-6',
        plan: 'Profesional',
        planCodigo: 'PROFESIONAL',
        isActive: true,
        createdAt: '2026-01-01T00:00:00.000Z',
      });
    });
  });

  describe('getById', () => {
    it('should return estudio by id wrapped in successResponse', async () => {
      const estudio = makeEstudio({
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      });
      mockEstudioRepo.findById.mockResolvedValue(estudio);

      const result = await controller.getById('est-1');
      expect(result.data).toHaveProperty('id', 'est-1');
      expect(result.data).toHaveProperty('nombre', 'Estudio Demo');
      expect(result.data).toHaveProperty('cuit', '20-12345678-6');
      expect(result.data).toHaveProperty('plan', 'PROFESIONAL');
      expect(result.data).toHaveProperty('isActive', true);
    });

    it('should throw when not found', async () => {
      await expect(controller.getById('bad')).rejects.toThrow('Estudio no encontrado');
    });
  });

  describe('suspend', () => {
    it('should deactivate estudio', async () => {
      const estudio = makeEstudio();
      mockEstudioRepo.findById.mockResolvedValue(estudio);

      await controller.suspend('est-1');
      expect(estudio.deactivate).toHaveBeenCalled();
      expect(mockEstudioRepo.save).toHaveBeenCalledWith(estudio);
    });

    it('should throw when not found', async () => {
      await expect(controller.suspend('bad')).rejects.toThrow('Estudio no encontrado');
    });
  });

  describe('reactivate', () => {
    it('should activate estudio', async () => {
      const estudio = makeEstudio({ isActive: false });
      mockEstudioRepo.findById.mockResolvedValue(estudio);

      await controller.reactivate('est-1');
      expect(estudio.activate).toHaveBeenCalled();
      expect(mockEstudioRepo.save).toHaveBeenCalledWith(estudio);
    });

    it('should throw when not found', async () => {
      await expect(controller.reactivate('bad')).rejects.toThrow('Estudio no encontrado');
    });
  });

  describe('create', () => {
    it('should create estudio via handler', async () => {
      const body = { nombre: 'Nuevo Estudio', cuit: '20-99999999-0', planCodigo: 'PROFESIONAL' };
      const result = await controller.create(body);

      expect(mockCrearEstudioHandler.execute).toHaveBeenCalledWith(body);
      expect(result.data).toHaveProperty('id', 'new-est-1');
      expect(result.data).toHaveProperty('nombre', 'Nuevo Estudio');
      expect(result.data).toHaveProperty('subscripcionId', 'sub-1');
    });

    it('should pass trialDias to handler', async () => {
      const body = { nombre: 'Trial Estudio', cuit: '20-88888888-0', planCodigo: 'FREE', trialDias: 60 };
      await controller.create(body);

      expect(mockCrearEstudioHandler.execute).toHaveBeenCalledWith(
        expect.objectContaining({ trialDias: 60 }),
      );
    });
  });
});
