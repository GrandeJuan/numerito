import { TareasController } from './tareas.controller';
import { Tarea } from '../../domain/entities/tarea.entity';

const makeTarea = (overrides: Partial<{ id: string; estudioId: string; clienteId: string }> = {}) =>
  Tarea.create(
    {
      titulo: 'Preparar balance',
      descripcion: 'Balance mensual cliente X',
      clienteId: overrides.clienteId ?? 'cliente-1',
      estudioId: overrides.estudioId ?? 'estudio-1',
      prioridad: 'MEDIA',
    },
    overrides.id,
  );

describe('TareasController', () => {
  let controller: TareasController;
  let mockRepo: any;

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn(),
      findAll: jest.fn().mockResolvedValue([]),
      findByResponsableId: jest.fn().mockResolvedValue([]),
      save: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn(),
    };
    controller = new TareasController(mockRepo);
  });

  describe('list', () => {
    it('should return paginated tareas for estudio', async () => {
      const tareas = [makeTarea(), makeTarea({ clienteId: 'cliente-2' })];
      mockRepo.findAll.mockResolvedValue(tareas);

      const result = await controller.list(1, 20);
      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(result.meta.page).toBe(1);
    });

    it('should use default page and limit when not provided', async () => {
      mockRepo.findAll.mockResolvedValue([]);

      const result = await controller.list();
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
    });

    it('should filter by responsableId when provided', async () => {
      const tarea = makeTarea();
      tarea.asignar('user-1');
      mockRepo.findByResponsableId.mockResolvedValue([tarea]);

      const result = await controller.list(1, 20, undefined, 'user-1');
      expect(result.data).toHaveLength(1);
      expect(mockRepo.findByResponsableId).toHaveBeenCalledWith('user-1');
    });

    it('should filter by estado when provided', async () => {
      const tareas = [makeTarea(), makeTarea()];
      mockRepo.findAll.mockResolvedValue(tareas);

      const result = await controller.list(1, 20, 'PENDIENTE');
      expect(result.data).toHaveLength(2);
    });

    it('should filter by clienteId when provided', async () => {
      const tareas = [makeTarea({ clienteId: 'cliente-1' })];
      mockRepo.findAll.mockResolvedValue(tareas);

      const result = await controller.list(1, 20, undefined, undefined, 'cliente-1');
      expect(result.data).toHaveLength(1);
    });
  });

  describe('create', () => {
    it('should create a new tarea', async () => {
      const dto = {
        titulo: 'Preparar DDJJ',
        descripcion: 'DDJJ mensual',
        clienteId: 'cliente-1',
        prioridad: 'ALTA' as const,
      };

      const result = await controller.create(dto, 'estudio-1');
      expect(result.data.id).toBeDefined();
      expect(result.data.titulo).toBe('Preparar DDJJ');
      expect(mockRepo.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('iniciar', () => {
    it('should start a tarea', async () => {
      const tarea = makeTarea();
      mockRepo.findById.mockResolvedValue(tarea);

      const result = await controller.iniciar(tarea.id);
      expect(result.data.estado).toBe('EN_PROGRESO');
      expect(mockRepo.save).toHaveBeenCalledTimes(1);
    });

    it('should throw when tarea not found', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(controller.iniciar('bad-id')).rejects.toThrow('Tarea no encontrad');
    });
  });

  describe('completar', () => {
    it('should complete a tarea in progress', async () => {
      const tarea = makeTarea();
      tarea.iniciar();
      mockRepo.findById.mockResolvedValue(tarea);

      const result = await controller.completar(tarea.id);
      expect(result.data.estado).toBe('COMPLETADO');
      expect(mockRepo.save).toHaveBeenCalledTimes(1);
    });

    it('should throw when tarea not found', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(controller.completar('bad-id')).rejects.toThrow('Tarea no encontrad');
    });
  });

  describe('asignar', () => {
    it('should assign responsable to tarea', async () => {
      const tarea = makeTarea();
      mockRepo.findById.mockResolvedValue(tarea);

      const result = await controller.asignar(tarea.id, { responsableId: 'user-1' });
      expect(result.data.responsableId).toBe('user-1');
      expect(mockRepo.save).toHaveBeenCalledTimes(1);
    });

    it('should throw when tarea not found', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(controller.asignar('bad-id', { responsableId: 'user-1' })).rejects.toThrow(
        'Tarea no encontrad',
      );
    });
  });

  describe('registrarHoras', () => {
    it('should register hours on tarea', async () => {
      const tarea = makeTarea();
      mockRepo.findById.mockResolvedValue(tarea);

      const result = await controller.registrarHoras(tarea.id, {
        horas: 2.5,
        descripcion: 'Trabajo en balance',
      });
      expect(result.data.horasRegistradas).toBe(2.5);
      expect(mockRepo.save).toHaveBeenCalledTimes(1);
    });

    it('should throw when tarea not found', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(
        controller.registrarHoras('bad-id', { horas: 1, descripcion: 'x' }),
      ).rejects.toThrow('Tarea no encontrad');
    });
  });

  describe('agregarComentario', () => {
    it('should add comment to tarea', async () => {
      const tarea = makeTarea();
      mockRepo.findById.mockResolvedValue(tarea);

      const result = await controller.agregarComentario(tarea.id, {
        autorId: 'user-1',
        texto: 'Avanzando bien',
      });
      expect(result.data.comentarios).toHaveLength(1);
      expect(result.data.comentarios[0].texto).toBe('Avanzando bien');
      expect(mockRepo.save).toHaveBeenCalledTimes(1);
    });

    it('should throw when tarea not found', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(
        controller.agregarComentario('bad-id', { autorId: 'u', texto: 't' }),
      ).rejects.toThrow('Tarea no encontrad');
    });
  });
});
