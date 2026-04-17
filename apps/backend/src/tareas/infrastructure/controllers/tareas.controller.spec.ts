import { TareasController } from './tareas.controller';
import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';

describe('TareasController', () => {
  let controller: TareasController;
  let mockCrearTareaHandler: { execute: jest.Mock };
  let mockIniciarTareaHandler: { execute: jest.Mock };
  let mockCompletarTareaHandler: { execute: jest.Mock };
  let mockAsignarTareaHandler: { execute: jest.Mock };
  let mockRegistrarHorasHandler: { execute: jest.Mock };
  let mockAgregarComentarioHandler: { execute: jest.Mock };
  let mockTareaListHandler: { execute: jest.Mock };
  let mockTareaKpisHandler: { execute: jest.Mock };

  const principal: EstudioPrincipal = { estudioId: 'estudio-1', userId: 'user-1', roles: [] };

  beforeEach(() => {
    mockCrearTareaHandler = { execute: jest.fn() };
    mockIniciarTareaHandler = { execute: jest.fn() };
    mockCompletarTareaHandler = { execute: jest.fn() };
    mockAsignarTareaHandler = { execute: jest.fn() };
    mockRegistrarHorasHandler = { execute: jest.fn() };
    mockAgregarComentarioHandler = { execute: jest.fn() };
    mockTareaListHandler = { execute: jest.fn().mockResolvedValue({ items: [], total: 0 }) };
    mockTareaKpisHandler = { execute: jest.fn() };
    controller = new TareasController(
      mockCrearTareaHandler as any,
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
    it('delegates to TareaListHandler with principal and default pagination', async () => {
      mockTareaListHandler.execute.mockResolvedValue({ items: [], total: 0 });

      const result = await controller.list(principal);

      expect(mockTareaListHandler.execute).toHaveBeenCalledWith(principal, {
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

      const result = await controller.list(principal);

      expect(result.data).toEqual(items);
      expect(result.meta.total).toBe(1);
    });

    it('forwards estado, clienteId, responsableId and prioridad filters to the handler', async () => {
      await controller.list(principal, 2, 50, 'EN_PROGRESO', 'u-1', 'cli-1', 'ALTA');

      expect(mockTareaListHandler.execute).toHaveBeenCalledWith(principal, {
        estado: 'EN_PROGRESO',
        clienteId: 'cli-1',
        responsableId: 'u-1',
        prioridad: 'ALTA',
        page: 2,
        limit: 50,
      });
    });
  });

  describe('kpis', () => {
    it('delegates to TareaKpisHandler with the principal', async () => {
      const kpis = { pendientes: 3, enProgreso: 2, completadas: 5, totalHoras: 12.5 };
      mockTareaKpisHandler.execute.mockResolvedValue(kpis);

      const result = await controller.kpis(principal);

      expect(mockTareaKpisHandler.execute).toHaveBeenCalledWith(principal);
      expect(result.data).toEqual(kpis);
    });

    it('propagates handler errors', async () => {
      mockTareaKpisHandler.execute.mockRejectedValue(new Error('db down'));
      await expect(controller.kpis(principal)).rejects.toThrow('db down');
    });
  });

  describe('create', () => {
    it('should delegate to CrearTareaHandler with principal and dto', async () => {
      const dto = {
        titulo: 'Preparar DDJJ',
        descripcion: 'DDJJ mensual',
        clienteId: 'cliente-1',
        prioridad: 'ALTA' as const,
      };
      const createdTarea = {
        id: 't-created',
        titulo: 'Preparar DDJJ',
        descripcion: 'DDJJ mensual',
        clienteId: 'cliente-1',
        estudioId: 'estudio-1',
        prioridad: 'ALTA',
        estado: 'PENDIENTE',
      };
      mockCrearTareaHandler.execute.mockResolvedValue(createdTarea);

      const result = await controller.create(dto, principal);

      expect(mockCrearTareaHandler.execute).toHaveBeenCalledWith(principal, dto);
      expect(result.data).toBe(createdTarea);
    });

    it('should propagate handler errors', async () => {
      mockCrearTareaHandler.execute.mockRejectedValue(new Error('DB error'));
      await expect(
        controller.create(
          { titulo: 't', prioridad: 'MEDIA' as const } as any,
          principal,
        ),
      ).rejects.toThrow('DB error');
    });
  });

  describe('iniciar', () => {
    it('should delegate to IniciarTareaHandler with principal and tarea id', async () => {
      const tarea = { id: 't-1', estado: 'EN_PROGRESO' };
      mockIniciarTareaHandler.execute.mockResolvedValue(tarea);

      const result = await controller.iniciar(principal, 't-1');

      expect(mockIniciarTareaHandler.execute).toHaveBeenCalledWith(principal, { tareaId: 't-1' });
      expect(result.data).toBe(tarea);
    });

    it('should propagate handler errors', async () => {
      mockIniciarTareaHandler.execute.mockRejectedValue(new Error('Tarea no encontrada'));
      await expect(controller.iniciar(principal, 'bad-id')).rejects.toThrow('Tarea no encontrad');
    });
  });

  describe('completar', () => {
    it('should delegate to CompletarTareaHandler with principal and tarea id', async () => {
      const tarea = { id: 't-1', estado: 'COMPLETADO' };
      mockCompletarTareaHandler.execute.mockResolvedValue(tarea);

      const result = await controller.completar(principal, 't-1');

      expect(mockCompletarTareaHandler.execute).toHaveBeenCalledWith(principal, { tareaId: 't-1' });
      expect(result.data).toBe(tarea);
    });

    it('should propagate handler errors', async () => {
      mockCompletarTareaHandler.execute.mockRejectedValue(new Error('Tarea no encontrada'));
      await expect(controller.completar(principal, 'bad-id')).rejects.toThrow('Tarea no encontrad');
    });
  });

  describe('asignar', () => {
    it('should delegate to AsignarTareaHandler with principal, tarea id and responsableId', async () => {
      const tarea = { id: 't-1', responsableId: 'user-1' };
      mockAsignarTareaHandler.execute.mockResolvedValue(tarea);

      const result = await controller.asignar(principal, 't-1', { responsableId: 'user-1' });

      expect(mockAsignarTareaHandler.execute).toHaveBeenCalledWith(principal, {
        tareaId: 't-1',
        responsableId: 'user-1',
      });
      expect(result.data).toBe(tarea);
    });

    it('should propagate handler errors', async () => {
      mockAsignarTareaHandler.execute.mockRejectedValue(new Error('Tarea no encontrada'));
      await expect(controller.asignar(principal, 'bad-id', { responsableId: 'user-1' })).rejects.toThrow(
        'Tarea no encontrad',
      );
    });
  });

  describe('registrarHoras', () => {
    it('should delegate to RegistrarHorasHandler with principal, tarea id and horas', async () => {
      const tarea = { id: 't-1', horasRegistradas: 2.5 };
      mockRegistrarHorasHandler.execute.mockResolvedValue(tarea);

      const result = await controller.registrarHoras(principal, 't-1', {
        horas: 2.5,
        descripcion: 'Trabajo en balance',
      });

      expect(mockRegistrarHorasHandler.execute).toHaveBeenCalledWith(principal, {
        tareaId: 't-1',
        horas: 2.5,
      });
      expect(result.data).toBe(tarea);
    });

    it('should propagate handler errors', async () => {
      mockRegistrarHorasHandler.execute.mockRejectedValue(new Error('Tarea no encontrada'));
      await expect(
        controller.registrarHoras(principal, 'bad-id', { horas: 1, descripcion: 'x' }),
      ).rejects.toThrow('Tarea no encontrad');
    });
  });

  describe('agregarComentario', () => {
    it('should delegate to AgregarComentarioHandler with principal, tarea id, autorId, and texto', async () => {
      const tarea = { id: 't-1', comentarios: [{ texto: 'Avanzando bien' }] };
      mockAgregarComentarioHandler.execute.mockResolvedValue(tarea);

      const result = await controller.agregarComentario(principal, 't-1', {
        autorId: 'user-1',
        texto: 'Avanzando bien',
      });

      expect(mockAgregarComentarioHandler.execute).toHaveBeenCalledWith(principal, {
        tareaId: 't-1',
        autorId: 'user-1',
        texto: 'Avanzando bien',
      });
      expect(result.data).toBe(tarea);
    });

    it('should propagate handler errors', async () => {
      mockAgregarComentarioHandler.execute.mockRejectedValue(new Error('Tarea no encontrada'));
      await expect(
        controller.agregarComentario(principal, 'bad-id', { autorId: 'u', texto: 't' }),
      ).rejects.toThrow('Tarea no encontrad');
    });
  });
});
