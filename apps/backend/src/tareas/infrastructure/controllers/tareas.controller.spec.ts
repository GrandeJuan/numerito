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
  let mockIniciarTareaHandler: { execute: jest.Mock };
  let mockCompletarTareaHandler: { execute: jest.Mock };
  let mockAsignarTareaHandler: { execute: jest.Mock };
  let mockRegistrarHorasHandler: { execute: jest.Mock };
  let mockAgregarComentarioHandler: { execute: jest.Mock };
  let mockTareaListHandler: { execute: jest.Mock };
  let mockTareaKpisHandler: { execute: jest.Mock };

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn(),
      findAll: jest.fn().mockResolvedValue([]),
      findByResponsableId: jest.fn().mockResolvedValue([]),
      save: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn(),
    };
    mockIniciarTareaHandler = { execute: jest.fn() };
    mockCompletarTareaHandler = { execute: jest.fn() };
    mockAsignarTareaHandler = { execute: jest.fn() };
    mockRegistrarHorasHandler = { execute: jest.fn() };
    mockAgregarComentarioHandler = { execute: jest.fn() };
    mockTareaListHandler = { execute: jest.fn().mockResolvedValue({ items: [], total: 0 }) };
    mockTareaKpisHandler = { execute: jest.fn() };
    controller = new TareasController(
      mockRepo,
      mockIniciarTareaHandler as any,
      mockCompletarTareaHandler as any,
      mockAsignarTareaHandler as any,
      mockRegistrarHorasHandler as any,
      mockAgregarComentarioHandler as any,
      mockTareaListHandler as any,
      mockTareaKpisHandler as any,
    );
  });

  describe('list', () => {
    it('delegates to TareaListHandler with estudioId and default pagination', async () => {
      mockTareaListHandler.execute.mockResolvedValue({ items: [], total: 0 });

      const result = await controller.list('estudio-1');

      expect(mockTareaListHandler.execute).toHaveBeenCalledWith({
        estudioId: 'estudio-1',
        estado: undefined,
        clienteId: undefined,
        responsableId: undefined,
        prioridad: undefined,
        page: 1,
        limit: 20,
      });
      expect(result.meta.total).toBe(0);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
    });

    it('returns DTO items and pagination metadata from the handler', async () => {
      const items = [
        {
          id: 't-1',
          titulo: 'Preparar balance',
          descripcion: null,
          clienteId: 'cli-1',
          clienteNombre: 'Empresa Alpha SRL',
          responsableId: 'u-1',
          responsableNombre: 'Ana Perez',
          estado: 'PENDIENTE',
          prioridad: 'MEDIA',
          horasRegistradas: 0,
        },
      ];
      mockTareaListHandler.execute.mockResolvedValue({ items, total: 1 });

      const result = await controller.list('estudio-1');

      expect(result.data).toEqual(items);
      expect(result.meta.total).toBe(1);
    });

    it('forwards estado, clienteId, responsableId and prioridad filters to the handler', async () => {
      await controller.list('estudio-1', 2, 50, 'EN_PROGRESO', 'u-1', 'cli-1', 'ALTA');

      expect(mockTareaListHandler.execute).toHaveBeenCalledWith({
        estudioId: 'estudio-1',
        estado: 'EN_PROGRESO',
        clienteId: 'cli-1',
        responsableId: 'u-1',
        prioridad: 'ALTA',
        page: 2,
        limit: 50,
      });
    });

    it('does not materialise rows via the repository for filtering', async () => {
      await controller.list('estudio-1', 1, 20, 'PENDIENTE');

      expect(mockRepo.findAll).not.toHaveBeenCalled();
      expect(mockRepo.findByResponsableId).not.toHaveBeenCalled();
    });
  });

  describe('kpis', () => {
    it('delegates to TareaKpisHandler with the estudioId', async () => {
      const kpis = { pendientes: 3, enProgreso: 2, completadas: 5, totalHoras: 12.5 };
      mockTareaKpisHandler.execute.mockResolvedValue(kpis);

      const result = await controller.kpis('estudio-1');

      expect(mockTareaKpisHandler.execute).toHaveBeenCalledWith({ estudioId: 'estudio-1' });
      expect(result.data).toEqual(kpis);
    });

    it('propagates handler errors', async () => {
      mockTareaKpisHandler.execute.mockRejectedValue(new Error('db down'));
      await expect(controller.kpis('estudio-1')).rejects.toThrow('db down');
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
    it('should delegate to IniciarTareaHandler with the tarea id', async () => {
      const tarea = makeTarea();
      tarea.iniciar();
      mockIniciarTareaHandler.execute.mockResolvedValue(tarea);

      const result = await controller.iniciar(tarea.id);

      expect(mockIniciarTareaHandler.execute).toHaveBeenCalledWith({ tareaId: tarea.id });
      expect(result.data.estado).toBe('EN_PROGRESO');
      expect(mockRepo.findById).not.toHaveBeenCalled();
      expect(mockRepo.save).not.toHaveBeenCalled();
    });

    it('should propagate handler errors', async () => {
      mockIniciarTareaHandler.execute.mockRejectedValue(new Error('Tarea no encontrada'));
      await expect(controller.iniciar('bad-id')).rejects.toThrow('Tarea no encontrad');
    });
  });

  describe('completar', () => {
    it('should delegate to CompletarTareaHandler with the tarea id', async () => {
      const tarea = makeTarea();
      tarea.iniciar();
      tarea.completar();
      mockCompletarTareaHandler.execute.mockResolvedValue(tarea);

      const result = await controller.completar(tarea.id);

      expect(mockCompletarTareaHandler.execute).toHaveBeenCalledWith({ tareaId: tarea.id });
      expect(result.data.estado).toBe('COMPLETADO');
      expect(mockRepo.findById).not.toHaveBeenCalled();
      expect(mockRepo.save).not.toHaveBeenCalled();
    });

    it('should propagate handler errors', async () => {
      mockCompletarTareaHandler.execute.mockRejectedValue(new Error('Tarea no encontrada'));
      await expect(controller.completar('bad-id')).rejects.toThrow('Tarea no encontrad');
    });
  });

  describe('asignar', () => {
    it('should delegate to AsignarTareaHandler with tarea id and responsableId', async () => {
      const tarea = makeTarea();
      tarea.asignar('user-1');
      mockAsignarTareaHandler.execute.mockResolvedValue(tarea);

      const result = await controller.asignar(tarea.id, { responsableId: 'user-1' });

      expect(mockAsignarTareaHandler.execute).toHaveBeenCalledWith({
        tareaId: tarea.id,
        responsableId: 'user-1',
      });
      expect(result.data.responsableId).toBe('user-1');
      expect(mockRepo.findById).not.toHaveBeenCalled();
      expect(mockRepo.save).not.toHaveBeenCalled();
    });

    it('should propagate handler errors', async () => {
      mockAsignarTareaHandler.execute.mockRejectedValue(new Error('Tarea no encontrada'));
      await expect(controller.asignar('bad-id', { responsableId: 'user-1' })).rejects.toThrow(
        'Tarea no encontrad',
      );
    });
  });

  describe('registrarHoras', () => {
    it('should delegate to RegistrarHorasHandler with tarea id and horas', async () => {
      const tarea = makeTarea();
      tarea.registrarHoras(2.5);
      mockRegistrarHorasHandler.execute.mockResolvedValue(tarea);

      const result = await controller.registrarHoras(tarea.id, {
        horas: 2.5,
        descripcion: 'Trabajo en balance',
      });

      expect(mockRegistrarHorasHandler.execute).toHaveBeenCalledWith({
        tareaId: tarea.id,
        horas: 2.5,
      });
      expect(result.data.horasRegistradas).toBe(2.5);
      expect(mockRepo.findById).not.toHaveBeenCalled();
      expect(mockRepo.save).not.toHaveBeenCalled();
    });

    it('should propagate handler errors', async () => {
      mockRegistrarHorasHandler.execute.mockRejectedValue(new Error('Tarea no encontrada'));
      await expect(
        controller.registrarHoras('bad-id', { horas: 1, descripcion: 'x' }),
      ).rejects.toThrow('Tarea no encontrad');
    });
  });

  describe('agregarComentario', () => {
    it('should delegate to AgregarComentarioHandler with tarea id, autorId, and texto', async () => {
      const tarea = makeTarea();
      tarea.agregarComentario('user-1', 'Avanzando bien');
      mockAgregarComentarioHandler.execute.mockResolvedValue(tarea);

      const result = await controller.agregarComentario(tarea.id, {
        autorId: 'user-1',
        texto: 'Avanzando bien',
      });

      expect(mockAgregarComentarioHandler.execute).toHaveBeenCalledWith({
        tareaId: tarea.id,
        autorId: 'user-1',
        texto: 'Avanzando bien',
      });
      expect(result.data.comentarios).toHaveLength(1);
      expect(result.data.comentarios[0].texto).toBe('Avanzando bien');
      expect(mockRepo.findById).not.toHaveBeenCalled();
      expect(mockRepo.save).not.toHaveBeenCalled();
    });

    it('should propagate handler errors', async () => {
      mockAgregarComentarioHandler.execute.mockRejectedValue(new Error('Tarea no encontrada'));
      await expect(
        controller.agregarComentario('bad-id', { autorId: 'u', texto: 't' }),
      ).rejects.toThrow('Tarea no encontrad');
    });
  });
});
