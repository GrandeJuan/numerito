import { NotificacionesController } from './notificaciones.controller';
import { Notificacion, TipoNotificacion } from '../../domain/entities/notificacion.entity';

const makeNotif = (id?: string, leida = false) => {
  const n = Notificacion.create(
    {
      usuarioId: 'user-1',
      estudioId: 'est-1',
      tipo: TipoNotificacion.VENCIMIENTO_PROXIMO,
      mensaje: 'Vencimiento IVA en 3 dias',
    },
    id,
  );
  if (leida) n.marcarLeida();
  return n;
};

describe('NotificacionesController', () => {
  let controller: NotificacionesController;
  let mockRepo: any;

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn(),
      findAll: jest.fn().mockResolvedValue([]),
      findByUsuario: jest.fn().mockResolvedValue({ data: [], total: 0 }),
      countUnread: jest.fn().mockResolvedValue(0),
      save: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn(),
    };
    controller = new NotificacionesController(mockRepo);
  });

  describe('GET /notificaciones', () => {
    it('should return paginated notificaciones', async () => {
      const notifs = [makeNotif('n-1'), makeNotif('n-2')];
      mockRepo.findByUsuario.mockResolvedValue({ data: notifs, total: 2 });

      const req = { user: { sub: 'user-1' } } as any;
      const result = await controller.findAll(req, undefined, 20, 0);

      expect(result).toEqual({ data: expect.any(Array), total: 2 });
      expect(mockRepo.findByUsuario).toHaveBeenCalledWith('user-1', {
        leida: undefined,
        limit: 20,
        offset: 0,
      });
    });

    it('should filter by leida=true', async () => {
      mockRepo.findByUsuario.mockResolvedValue({ data: [], total: 0 });

      const req = { user: { sub: 'user-1' } } as any;
      await controller.findAll(req, 'true', 20, 0);

      expect(mockRepo.findByUsuario).toHaveBeenCalledWith('user-1', {
        leida: true,
        limit: 20,
        offset: 0,
      });
    });

    it('should filter by leida=false', async () => {
      mockRepo.findByUsuario.mockResolvedValue({ data: [], total: 0 });

      const req = { user: { sub: 'user-1' } } as any;
      await controller.findAll(req, 'false', 20, 0);

      expect(mockRepo.findByUsuario).toHaveBeenCalledWith('user-1', {
        leida: false,
        limit: 20,
        offset: 0,
      });
    });
  });

  describe('PATCH /notificaciones/:id/leer', () => {
    it('should mark notificacion as read', async () => {
      const notif = makeNotif('n-1');
      mockRepo.findById.mockResolvedValue(notif);

      const req = { user: { sub: 'user-1' } } as any;
      const result = await controller.marcarLeida(req, 'n-1');

      expect(notif.leida).toBe(true);
      expect(mockRepo.save).toHaveBeenCalledWith(notif);
      expect(result).toEqual({ ok: true });
    });

    it('should throw when notificacion not found', async () => {
      mockRepo.findById.mockResolvedValue(null);

      const req = { user: { sub: 'user-1' } } as any;
      await expect(controller.marcarLeida(req, 'bad-id')).rejects.toThrow(
        'Notificacion no encontrad',
      );
    });

    it('should throw when notificacion belongs to another user', async () => {
      const notif = makeNotif('n-1');
      mockRepo.findById.mockResolvedValue(notif);

      const req = { user: { sub: 'other-user' } } as any;
      await expect(controller.marcarLeida(req, 'n-1')).rejects.toThrow();
    });
  });

  describe('GET /notificaciones/unread-count', () => {
    it('should return unread count', async () => {
      mockRepo.countUnread.mockResolvedValue(5);

      const req = { user: { sub: 'user-1' } } as any;
      const result = await controller.unreadCount(req);

      expect(result).toEqual({ count: 5 });
      expect(mockRepo.countUnread).toHaveBeenCalledWith('user-1');
    });
  });
});
