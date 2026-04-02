import { AdminEstudiosController } from './admin-estudios.controller';

describe('AdminEstudiosController', () => {
  let controller: AdminEstudiosController;
  let mockEstudioRepo: any;

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
    mockEstudioRepo = {
      findAll: jest.fn().mockResolvedValue([]),
      findById: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockResolvedValue(undefined),
    };
    controller = new AdminEstudiosController(mockEstudioRepo);
  });

  describe('list', () => {
    it('should return all estudios', async () => {
      const estudios = [makeEstudio(), makeEstudio({ id: 'est-2' })];
      mockEstudioRepo.findAll.mockResolvedValue(estudios);

      const result = await controller.list();
      expect(result.data).toHaveLength(2);
    });
  });

  describe('getById', () => {
    it('should return estudio by id', async () => {
      const estudio = makeEstudio();
      mockEstudioRepo.findById.mockResolvedValue(estudio);

      const result = await controller.getById('est-1');
      expect(result.id).toBe('est-1');
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
});
